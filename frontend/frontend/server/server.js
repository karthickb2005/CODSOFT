require('dotenv').config();
console.log("ENV LOADED:", !!process.env.SMTP_USER);

const isProduction = process.env.NODE_ENV === 'production';
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');

console.log("DISABLE_EMAIL VALUE:", process.env.DISABLE_EMAIL);
console.log("JWT_SECRET loaded:", !!process.env.JWT_SECRET);

const express = require('express');
const logger = require('./src/utils/logger');

// --- Global Crash Protection ---
process.on('uncaughtException', (err) => {
    console.error(`✖ Critical system error detected (uncaughtException): ${err.message}`);
    if (err.stack) console.error(err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('✖ Critical system error detected (unhandledRejection):', reason);
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

const cors = require('cors');
const helmet = require('helmet');
const requestLogger = require('./src/middleware/requestLogger');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./src/middleware/errorMiddleware');
const { connectDB, closeDB } = require('./src/config/db');
const { observabilityMiddleware } = require('./src/middleware/observabilityMiddleware');
const seedData = require('./src/config/seed');
const { initIO } = require('./src/socket');

const port = process.env.PORT || 5001;

// --- Environment Validation ---
const requiredEnv = ['JWT_SECRET', 'MONGO_URI'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);

if (missingEnv.length > 0) {
    if (isProduction) {
        logger.error(`✖ MISSING REQUIRED ENV VARS: ${missingEnv.join(', ')}. Server may malfunction.`);
    } else {
        logger.warn(`⚠ Missing environment variables in development: ${missingEnv.join(', ')}`);
    }
}

// Warm up DB connection
connectDB();

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret && isProduction) {
    logger.error('✖ CRITICAL: JWT_SECRET is missing in production. Authentication is insecure.');
}

const app = express();
const server = http.createServer(app);

// =============================================
// REGISTER ALL MIDDLEWARE & ROUTES AT MODULE LEVEL
// (Required for Vercel Serverless compatibility)
// =============================================

app.use(observabilityMiddleware);
app.use(compression());
app.set('trust proxy', 1);

app.use(helmet({
    contentSecurityPolicy: false,
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

if (isProduction) {
    app.use('/api', limiter);
}

// Global Request Timeout (30s)
app.use((req, res, next) => {
    res.setTimeout(30000, () => {
        try {
            if (!res.headersSent) {
                res.status(503).json({ success: false, message: "Request timeout" });
            }
        } catch (err) {
            console.error("Timeout response already sent");
        }
    });
    next();
});

// CORS
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    /\.vercel\.app$/ // Allow all Vercel subdomains
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const isAllowed = allowedOrigins.some(pattern => {
            if (pattern instanceof RegExp) return pattern.test(origin);
            return pattern === origin;
        });
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(requestLogger);

// Health check
app.get("/api/health", (req, res) => {
    return res.status(200).json({ status: "UP", success: true, timestamp: new Date() });
});

// API Routes
app.use('/health', require('./src/routes/systemRoutes'));
app.use('/api/auth', require('./src/routes/userRoutes'));
app.use('/api/tasks', require('./src/routes/taskRoutes'));
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));
app.use('/api/ai', require('./src/routes/ai.routes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/projects', require('./src/routes/projectRoutes'));
app.use('/api/team', require('./src/routes/teamRoutes'));
app.use('/api/ai-insights', require('./src/routes/aiRoutes'));
app.use('/api/activity', require('./src/routes/activityRoutes'));
app.use('/api/analytics', require('./src/routes/analyticsRoutes'));
app.use('/api/invite', require('./src/routes/inviteRoutes'));
app.use('/api/zoom', require('./src/routes/zoomRoutes'));
app.use('/api/leaderboard', require('./src/routes/leaderboardRoutes').default || require('./src/routes/leaderboardRoutes'));

// Error Handler
app.use(errorHandler);

// =============================================
// SERVER LISTEN (only in non-Vercel environments)
// =============================================
const startServer = async () => {
    try {
        logger.info(`--- TaskPilot Backend: Startup [Mode: ${process.env.NODE_ENV || 'development'}] ---`);

        await connectDB();
        logger.info('✔ Database connection established');

        // Email System Validation
        const { validateSMTPConfig } = require('./src/utils/emailService');
        const missingSmtp = validateSMTPConfig();
        if (missingSmtp.length > 0) {
            logger.warn(`⚠ Email system starting in DEGRADED mode (missing: ${missingSmtp.join(', ')})`);
        } else {
            logger.info('✔ Email system initialized');
        }

        // Background Workers
        try {
            if (process.env.CHAOS_MODE === 'true') {
                app.use((req, res, next) => {
                    const random = Math.random();
                    if (random < 0.02 && req.originalUrl.includes('/api/')) {
                        return res.status(503).json({ success: false, message: "Synthetic Chaos Failure" });
                    }
                    if (random < 0.05) {
                        return setTimeout(next, Math.floor(Math.random() * 2000) + 1000);
                    }
                    next();
                });
            }

            if (process.env.ENABLE_WORKER === 'true') {
                require('./src/config/redis');
                const { initWorkers } = require('./src/queue/worker');
                const { overdueQueue } = require('./src/queue/queue');
                initWorkers();
                Promise.race([
                    overdueQueue.add('periodic_overdue_scan', {}, { repeat: { pattern: '0 * * * *' } }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Queue timeout')), 2000))
                ]).catch(queueError => {
                    logger.warn('--- ⚠ Background Services partially started ---', { error: queueError.message });
                });
            }
        } catch (queueError) {
            logger.warn('--- ⚠ Background Services failed — API-ONLY mode ---', { error: queueError.message });
        }

        // Seed in dev
        if (!isProduction) {
            try {
                await seedData();
                logger.info('--- Data Seeding Completed ---');
            } catch (seedError) {
                logger.error(`--- ⚠ Data Seeding Failed: ${seedError.message} ---`);
            }
        }

        // Graceful Shutdown
        const gracefulShutdown = async (signal) => {
            logger.info(`--- ${signal} received: Graceful shutdown ---`);
            server.close(async () => {
                try {
                    const redis = require('./src/config/redis');
                    if (redis && redis.quit) await redis.quit();
                } catch (err) { }
                await closeDB();
                process.exit(0);
            });
            setTimeout(() => process.exit(1), 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        return new Promise((resolve) => {
            initIO(server);
            server.listen(port, () => {
                logger.info(`🚀 Server running on port ${port}`);
                setInterval(() => {
                    const memory = process.memoryUsage();
                    const heapUsedMB = Math.round(memory.heapUsed / 1024 / 1024);
                    const heapTotalMB = Math.round(memory.heapTotal / 1024 / 1024);
                    if ((heapUsedMB / heapTotalMB) * 100 > 80) {
                        logger.warn('⚠ High memory usage detected');
                    }
                }, 60000);
                resolve(server);
            });
        });
    } catch (error) {
        console.error(`❌ Server core startup failed: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
};

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
    startServer();
}

module.exports = app;
