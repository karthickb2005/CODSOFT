const logger = require('./logger');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retries an async operation with exponential backoff
 * @param {Function} action - Async function to retry
 * @param {Object} options - Retry options (maxRetries, initialDelay)
 * @returns {Promise<any>}
 */
const retry = async (action, options = {}) => {
    const maxRetries = options.maxRetries || 3;
    const requestId = options.requestId || null;
    let delay = options.initialDelay || 500;
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await action();
        } catch (error) {
            lastError = error;
            if (i === maxRetries - 1) break;

            logger.warn(`⚠ Operation failed, retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`, {
                error: error.message,
                requestId,
                retryCount: i + 1
            });

            await sleep(delay);
            delay *= 2; // Exponential backoff
        }
    }

    throw lastError;
};

module.exports = retry;
