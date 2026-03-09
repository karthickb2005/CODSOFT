const AIGateway = require('../services/aiGateway');

/**
 * Centered client for AI requests with multi-provider failover
 */
const postAIRequest = async (url, data, headers = {}, requestId = null) => {
    try {
        const result = await AIGateway.invoke(url, data, headers, requestId);
        return result;
    } catch (error) {
        // Final catch-all if even fallback fails (unlikely)
        return {
            success: false,
            message: "All AI providers unavailable",
            retryable: true,
            aiProvider: "none"
        };
    }
};

module.exports = {
    postAIRequest
};
