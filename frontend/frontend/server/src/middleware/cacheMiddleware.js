const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// Cache TTL defaults to 60 seconds
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

const cacheMiddleware = (duration = 60) => {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const key = `__express__${req.originalUrl || req.url}`;
        const cachedResponse = cache.get(key);

        if (cachedResponse) {
            res.set('X-Cache', 'HIT');
            res.set('Cache-Control', `public, max-age=${duration}`);
            return res.status(200).json(cachedResponse);
        } else {
            res.originalJson = res.json;
            res.json = (body) => {
                // Only cache successful JSON responses
                if (res.statusCode === 200 && body && body.success !== false) {
                    cache.set(key, body, duration);
                }
                res.set('X-Cache', 'MISS');
                res.set('Cache-Control', `public, max-age=${duration}`);
                res.originalJson(body);
            };
            next();
        }
    };
};

module.exports = cacheMiddleware;
