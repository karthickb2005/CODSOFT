const NodeCache = require('node-cache');
const redis = require('../config/redis');

// Fallback in-memory cache
const localCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

/**
 * Get value from cache (Redis first, then local)
 */
const get = async (key) => {
    try {
        if (redis.status === 'ready') {
            const val = await redis.get(key);
            return val ? JSON.parse(val) : undefined;
        }
    } catch (error) {
        logger.error(`[Redis] Get Error: ${error.message}`);
    }
    return localCache.get(key);
};

/**
 * Set value in cache
 */
const set = async (key, value, ttl = 3600) => {
    try {
        if (redis.status === 'ready') {
            await redis.set(key, JSON.stringify(value), 'EX', ttl);
        }
    } catch (error) {
        logger.error(`[Redis] Set Error: ${error.message}`);
    }
    localCache.set(key, value, ttl);
};

/**
 * Delete key from cache
 */
const del = async (key) => {
    try {
        if (redis.status === 'ready') {
            await redis.del(key);
        }
    } catch (error) {
        logger.error(`[Redis] Del Error: ${error.message}`);
    }
    localCache.del(key);
};

/**
 * Invalidate by prefix
 */
const invalidateByPrefix = async (prefix) => {
    try {
        if (redis.status === 'ready') {
            const keys = await redis.keys(`${prefix}*`);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        }
    } catch (error) {
        logger.error(`[Redis] Prefix Invalidation Error: ${error.message}`);
    }

    // Local invalidation
    const localKeys = localCache.keys();
    localKeys.forEach(key => {
        if (key.startsWith(prefix)) {
            localCache.del(key);
        }
    });
};

/**
 * Older compatibility: Get or set cache value
 */
const getOrSet = async (key, fetchFunc, ttl) => {
    const value = await get(key);
    if (value !== undefined) {
        return value;
    }

    const newValue = await fetchFunc();
    await set(key, newValue, ttl);
    return newValue;
};

/**
 * Compatibility: Invalidate by pattern (regex)
 */
const invalidatePattern = async (pattern) => {
    // For regex, we'll mostly rely on prefix if possible, 
    // but for true regex we iterate (not recommended for production Redis, but okay for this context)
    try {
        if (redis.status === 'ready') {
            const keys = await redis.keys('*');
            const regex = new RegExp(pattern);
            const filtered = keys.filter(k => regex.test(k));
            if (filtered.length > 0) {
                await redis.del(...filtered);
            }
        }
    } catch (error) {
        console.error('Redis pattern invalidation error:', error.message);
    }

    const localKeys = localCache.keys();
    const regex = new RegExp(pattern);
    localKeys.forEach(key => {
        if (regex.test(key)) {
            localCache.del(key);
        }
    });
};

module.exports = {
    get,
    set,
    del,
    getOrSet,
    invalidate: del,
    invalidatePattern,
    invalidateByPrefix,
    localCache // Exported for testing degradation
};
