const winston = require('winston');

// Vercel has a read-only filesystem — file transports will crash on startup.
// Only use console logging when running on Vercel (or when VERCEL env var is set).
const isVercel = !!process.env.VERCEL;

const transports = [
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.printf(({ timestamp, level, message, requestId }) => {
                const idPart = requestId ? ` [${requestId}]` : '';
                return `${timestamp}${idPart} [${level}]: ${message}`;
            })
        ),
    }),
];

// Only add file transports in non-Vercel environments
if (!isVercel) {
    const fs = require('fs');
    if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs', { recursive: true });
    }
    transports.push(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
    transports.push(new winston.transports.File({ filename: 'logs/combined.log' }));
}

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'taskpilot-backend' },
    transports,
});

module.exports = logger;
