const logger = require('../utils/logger');

// In-memory rolling counters (stateless for this session, would ideally be in Redis for production)
let aiMetrics = {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    providerBreakdown: {
        gemini: { requests: 0, tokens: 0, cost: 0 },
        openai: { requests: 0, tokens: 0, cost: 0 },
        fallback: { requests: 0, tokens: 0, cost: 0 }
    }
};

// Pricing Map (Cost per 1k tokens in USD)
const PRICING = {
    gemini: 0.000125, // gemini-1.5-flash estimate
    openai: 0.002,    // gpt-3.5-turbo estimate
    fallback: 0.0
};

/**
 * Record usage after an AI request
 */
const recordAIUsage = (provider, tokens, requestId) => {
    const rate = PRICING[provider] || 0;
    const estimatedCost = (tokens / 1000) * rate;

    aiMetrics.totalRequests++;
    aiMetrics.totalTokens += tokens;
    aiMetrics.totalCost += estimatedCost;

    if (aiMetrics.providerBreakdown[provider]) {
        aiMetrics.providerBreakdown[provider].requests++;
        aiMetrics.providerBreakdown[provider].tokens += tokens;
        aiMetrics.providerBreakdown[provider].cost += estimatedCost;
    }

    logger.info(`💰 AI Cost Estimate { provider: ${provider}, tokens: ${tokens}, cost: $${estimatedCost.toFixed(6)}, requestId: ${requestId} }`);
};

/**
 * Get current metrics for observability
 */
const getAIMetrics = () => {
    return {
        ...aiMetrics,
        budgetLimit: process.env.AI_MONTHLY_TOKEN_LIMIT || 1000000,
        usagePercent: ((aiMetrics.totalTokens / (process.env.AI_MONTHLY_TOKEN_LIMIT || 1000000)) * 100).toFixed(2)
    };
};

module.exports = {
    recordAIUsage,
    getAIMetrics
};
