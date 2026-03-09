const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Global metrics store (In-memory for simplicity, as per requirements)
const metrics = {
    totalRequests: 0,
    slowRequests: 0,
    errorCount: 0,
    startTime: Date.now()
};

const observabilityMiddleware = (req, res, next) => {
    // Phase 1: Request Tracing
    const requestId = req.headers['x-request-id'] || uuidv4();
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    // Phase 2: Performance Metrics
    const start = Date.now();
    metrics.totalRequests++;

    // Track request completion
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;

        // Structured performance log
        const logData = {
            requestId: req.requestId,
            method: req.method,
            url: req.originalUrl,
            statusCode,
            durationMs: duration
        };

        if (duration > 1000) {
            metrics.slowRequests++;
            logger.warn(`⚠ Slow request detected: ${req.method} ${req.originalUrl} [${duration}ms]`, logData);
        } else {
            logger.info(`${req.method} ${req.originalUrl} [${statusCode}] - ${duration}ms`, logData);
        }

        if (statusCode >= 400) {
            metrics.errorCount++;
        }
    });

    next();
};

const getMetrics = () => {
    const memory = process.memoryUsage();
    return {
        uptime: `${Math.floor((Date.now() - metrics.startTime) / 1000)}s`,
        memoryUsage: {
            rss: `${Math.round(memory.rss / 1024 / 1024 * 100) / 100} MB`,
            heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024 * 100) / 100} MB`,
            heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024 * 100) / 100} MB`
        },
        requests: {
            total: metrics.totalRequests,
            slow: metrics.slowRequests,
            errors: metrics.errorCount
        },
        timestamp: new Date().toISOString()
    };
};

module.exports = {
    observabilityMiddleware,
    getMetrics
};
