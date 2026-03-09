const logger = require('../utils/logger');

// In-memory performance registry
let providerStats = {
    gemini: {
        latency: [], // rolling window of last 10 requests
        successCount: 0,
        totalCount: 0,
        lastScore: 1.0,
        adaptiveTimeout: 8000
    },
    openai: {
        latency: [],
        successCount: 0,
        totalCount: 0,
        lastScore: 0.8, // Initial lower score due to cost
        adaptiveTimeout: 8000
    }
};

const ROLLING_WINDOW_SIZE = 10;

class AIOptimizer {
    /**
     * Record performance after a request completes
     */
    static recordPerformance(provider, latency, success, requestId) {
        if (!providerStats[provider]) return;

        const stats = providerStats[provider];
        stats.totalCount++;
        if (success) stats.successCount++;

        // Update rolling latency
        stats.latency.push(latency);
        if (stats.latency.length > ROLLING_WINDOW_SIZE) {
            stats.latency.shift();
        }

        // Calculate new score and timeout
        this.updateOptimizer(provider, requestId);
    }

    static updateOptimizer(provider, requestId) {
        const stats = providerStats[provider];

        // 1. Success Rate Score (0.0 - 1.0)
        const successRate = stats.successCount / stats.totalCount;

        // 2. Latency Score (0.0 - 1.0) - Lower latency is better
        const avgLatency = stats.latency.reduce((a, b) => a + b, 0) / (stats.latency.length || 1);
        const latencyScore = Math.max(0, 1 - (avgLatency / 10000)); // Normalized to 10s baseline

        // 3. Cost Efficiency (Static for now based on provider rates)
        const costEfficiency = provider === 'gemini' ? 1.0 : 0.4;

        // Dynamic Weighting
        const newScore = (successRate * 0.5) + (latencyScore * 0.3) + (costEfficiency * 0.2);

        // Dynamic Timeout Adjustment (4s - 12s)
        const newTimeout = Math.min(12000, Math.max(4000, Math.round(avgLatency * 1.5)));

        const scoreChanged = Math.abs(stats.lastScore - newScore) > 0.1;
        stats.lastScore = newScore;
        stats.adaptiveTimeout = newTimeout;

        if (scoreChanged) {
            logger.info(`🧠 Optimizer updated ranking { provider: ${provider}, newScore: ${newScore.toFixed(2)}, adaptiveTimeout: ${newTimeout}ms, requestId: ${requestId} }`);

            // Publish to live stream
            try {
                const AIEventStream = require('./aiEventStream');
                this.publishLiveUpdate();
            } catch (e) { }
        }
    }

    static publishLiveUpdate() {
        const AIEventStream = require('./aiEventStream');
        const metrics = this.getMetrics();
        AIEventStream.publishOptimizerUpdate(metrics.rankings, metrics.stats);
    }

    /**
     * Get providers sorted by performance score
     */
    static getRankedProviders() {
        return Object.keys(providerStats)
            .sort((a, b) => providerStats[b].lastScore - providerStats[a].lastScore);
    }

    static getProviderParams(provider) {
        return providerStats[provider] || { adaptiveTimeout: 8000, lastScore: 0 };
    }

    static getMetrics() {
        return {
            rankings: this.getRankedProviders().map(p => ({
                provider: p,
                score: providerStats[p].lastScore.toFixed(2),
                timeout: providerStats[p].adaptiveTimeout
            })),
            stats: providerStats
        };
    }
}

module.exports = AIOptimizer;
