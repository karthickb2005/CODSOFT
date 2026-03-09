const logger = require('../utils/logger');
const AIPolicyEngine = require('./aiPolicyEngine');
const AIOptimizer = require('./aiOptimizer');
const { getAIMetrics } = require('../middleware/aiCostTracker');

class AIDigitalTwin {
    /**
     * Run a synthetic batch of requests to test policies and routing
     */
    static async runSimulation(batchSize = 20, policyOverrides = null) {
        const simulationId = `sim-${Date.now()}`;
        logger.info(`🧪 Digital Twin started { simulationId: ${simulationId}, batchSize: ${batchSize} }`);

        const results = [];
        const metrics = getAIMetrics();
        const providers = AIOptimizer.getRankedProviders();

        for (let i = 0; i < batchSize; i++) {
            const isPriority = Math.random() > 0.8;
            const metadata = { userId: isPriority ? 'vip_user_1' : 'regular_joe_sim' };

            // Mirror aiGateway Decision Chain
            const decision = this.simulateDecision(simulationId, metadata, policyOverrides, metrics, providers);
            results.push(decision);
        }

        const report = this.generateReport(results);

        const riskLevel = report.predictedFailures > (batchSize * 0.2) ? 'HIGH' : 'LOW';
        logger.info(`✔ Simulation completed { simulationId: ${simulationId}, improvementScore: ${report.improvementScore}, riskLevel: ${riskLevel} }`);

        // If simulation detected high risk, log a warning
        if (riskLevel === 'HIGH') {
            logger.warn(`⚠ Risky policy detected in Digital Twin simulation`, { simulationId, predictedFailures: report.predictedFailures });
        }

        const AIEventStream = require('./aiEventStream');
        AIEventStream.publishSimulationComplete(report);

        return { simulationId, ...report, timestamp: new Date().toISOString() };
    }

    static simulateDecision(simulationId, metadata, policyOverrides, metrics, providers) {
        // 1. Policy Decision (Mirroring aiGateway)
        const policy = policyOverrides || AIPolicyEngine.getRoutingPolicy(simulationId, metadata);

        // 2. Budget Check
        const softLimit = (process.env.AI_SOFT_LIMIT_PERCENT || 80) / 100;
        const currentUsage = metrics.totalTokens;
        const budgetLimit = metrics.budgetLimit;

        const isHardLimitReached = currentUsage >= budgetLimit;
        const isSoftLimitReached = currentUsage >= (budgetLimit * softLimit);

        if (isHardLimitReached) {
            return { provider: 'fallback', reason: 'Hard Budget Limit', class: policy.trafficClass };
        }

        // 3. Routing Loop
        for (const providerId of providers) {
            if (policy.blacklist.includes(providerId)) continue;

            const { lastScore } = AIOptimizer.getProviderParams(providerId);

            // Skip expensive if soft limit reached (Standard users only)
            if (providerId === 'openai' && isSoftLimitReached && policy.trafficClass !== 'priority') {
                continue;
            }

            // Simulate Success/Failure based on history (successRate)
            const stats = AIOptimizer.getMetrics().stats[providerId] || { successCount: 1, totalCount: 1 };
            const successProbability = stats.successCount / (stats.totalCount || 1);

            if (Math.random() <= successProbability) {
                return {
                    provider: providerId,
                    score: lastScore,
                    class: policy.trafficClass,
                    isFallback: false,
                    estimatedTokens: 500 // Simulation default
                };
            }
        }

        return { provider: 'fallback', reason: 'Failover Exhausted', class: policy.trafficClass };
    }

    static generateReport(results) {
        const distribution = {};
        let failures = 0;
        let priorityRequests = 0;
        let totalSimulatedCost = 0;

        results.forEach(r => {
            distribution[r.provider] = (distribution[r.provider] || 0) + 1;
            if (r.provider === 'fallback') failures++;
            if (r.class === 'priority') priorityRequests++;

            // Simple cost estimation per simulation
            if (r.provider === 'gemini') totalSimulatedCost += 0.00006;
            if (r.provider === 'openai') totalSimulatedCost += 0.001;
        });

        return {
            totalRequests: results.length,
            providerDistribution: distribution,
            predictedFailures: failures,
            priorityTrafficPercent: ((priorityRequests / results.length) * 100).toFixed(1),
            estimatedCostImpact: totalSimulatedCost.toFixed(4),
            improvementScore: (100 - (failures / results.length * 100)).toFixed(1)
        };
    }
}

module.exports = AIDigitalTwin;
