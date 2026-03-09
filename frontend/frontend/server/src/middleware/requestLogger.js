const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
    const requestId = req.header('X-Request-Id') || uuidv4();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    const startTime = Date.now();

    // Log request start
    logger.info(`Incoming ${req.method} ${req.originalUrl}`, {
        requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });

    // Log request completion
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info(`Completed ${req.method} ${req.originalUrl}`, {
            requestId,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
        });
    });

    next();
};

module.exports = requestLogger;
