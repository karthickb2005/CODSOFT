const Redis = require('ioredis');
const logger = require('../utils/logger');

const redisOptions = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
        // Stop retrying after 5 attempts to prevent log flood in dev if Redis is missing
        if (times > 5) {
            logger.warn('Redis unavailable — running API-only mode');
            return null; // Stop retrying
        }
        const delay = Math.min(times * 1000, 5000);
        return delay;
    },
    maxRetriesPerRequest: null, // Required for BullMQ
    connectTimeout: 5000,
};

const redis = new Redis(redisOptions);

redis.on('connect', () => {
    logger.info('--- Redis Connected ---');
});

redis.on('error', (err) => {
    // Only log once every 5 seconds to prevent log flood
    if (!redis._lastErrorLog || Date.now() - redis._lastErrorLog > 5000) {
        logger.error(`Redis connection error: ${err.message}`);
        redis._lastErrorLog = Date.now();
    }
});

module.exports = redis;
