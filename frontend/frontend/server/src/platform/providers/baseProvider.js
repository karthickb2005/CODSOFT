const logger = require('../../utils/logger');

/**
 * Base AI Provider Adapter
 * All specific providers (Gemini, OpenAI, etc.) must extend this class.
 */
class BaseProvider {
    constructor(name) {
        this.name = name;
    }

    /**
     * Invoke the provider with a unified payload
     * @returns {Promise<Object>} Unified response object
     */
    async invoke(payload, timeout, requestId) {
        throw new Error(`Method 'invoke' must be implemented by ${this.constructor.name}`);
    }

    /**
     * Get health status from provider-specific logic
     */
    getHealth() {
        return 'healthy'; // Default implementation
    }

    /**
     * Normalize provider-specific errors into platform status codes
     */
    normalizeError(error) {
        const message = error.message || 'Unknown Provider Error';

        if (message.includes('429') || message.includes('quota') || message.includes('Rate limit')) {
            return 'capacity_limited';
        }
        if (message.includes('503') || message.includes('502') || message.includes('overloaded')) {
            return 'unavailable';
        }
        if (message.includes('timeout')) {
            return 'degraded';
        }

        return 'error';
    }

    /**
     * Standardize the successful response
     */
    formatResponse(success, data, latency, tokens, status = 'success') {
        return {
            success,
            aiProvider: this.name,
            latencyMs: latency,
            tokensUsed: tokens || 0,
            normalizedStatus: status,
            data
        };
    }
}

module.exports = BaseProvider;
