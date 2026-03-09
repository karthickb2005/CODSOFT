const logger = require('../utils/logger');
const CircuitBreaker = require('../utils/circuitBreaker');
const { recordAIUsage, getAIMetrics } = require('../middleware/aiCostTracker');
const AIOptimizer = require('./aiOptimizer');
const AIPolicyEngine = require('./aiPolicyEngine');
const providerRegistry = require('../platform/providers/providerRegistry');
const GeminiAdapter = require('../platform/providers/geminiAdapter');
const OpenAIAdapter = require('../platform/providers/openaiAdapter');
const LocalFallbackAdapter = require('../platform/providers/localFallbackAdapter');

// Initialize Provider Abstraction Layer
providerRegistry.register(new GeminiAdapter());
providerRegistry.register(new OpenAIAdapter());
providerRegistry.register(new LocalFallbackAdapter());

// Independent Circuit Breakers (Existing)
const geminiCircuit = new CircuitBreaker('GeminiProvider', { failureThreshold: 3, recoveryTimeout: 60000 });
const openaiCircuit = new CircuitBreaker('OpenAIProvider', { failureThreshold: 3, recoveryTimeout: 60000 });

/**
 * AI Gateway handles autonomous governance, multi-provider failover, and self-optimization
 */
const pluginManager = require('../platform/pluginManager');

class AIGateway {
    static async invoke(url, data, headers, requestId, metadata = {}) {
        // Platform Context: Extract tenantId
        const tenantId = headers['x-tenant-id'] || metadata.tenantId || 'global';
        metadata.tenantId = tenantId;

        // PHASE 0: Plugin Pre-routing Hook
        await pluginManager.runHook('beforeAIRoute', { url, data, metadata, requestId });

        // --- PHASE 1: Policy Governance ---
        const policy = AIPolicyEngine.getRoutingPolicy(requestId, metadata);
        const metrics = getAIMetrics();

        // --- PHASE 2: Budget Control ---
        const softLimit = (process.env.AI_SOFT_LIMIT_PERCENT || 80) / 100;
        const isHardLimitReached = metrics.totalTokens >= metrics.budgetLimit;
        const isSoftLimitReached = metrics.totalTokens >= (metrics.budgetLimit * softLimit);

        if (isHardLimitReached) {
            logger.warn(`🛑 AI Budget Hard Limit Reached — Forcing Fallback`, { requestId });
            return this.getLocalFallback(data, requestId, policy);
        }

        // --- PHASE 3: Strategy & Ranking ---
        const providers = AIOptimizer.getRankedProviders();
        let lastError;

        for (const providerId of providers) {
            // Check autonomous blacklist
            if (policy.blacklist.includes(providerId)) {
                logger.debug(`Skipping blacklisted provider: ${providerId}`, { requestId });
                continue;
            }

            // Budget constraint for premium providers
            if (providerId === 'openai' && isSoftLimitReached && policy.trafficClass !== 'priority') {
                logger.info(`⚠ Budget constraint: Skipping OpenAI for standard class`, { requestId });
                continue;
            }

            try {
                const adapter = providerRegistry.get(providerId);
                const circuit = providerId === 'gemini' ? geminiCircuit : openaiCircuit;

                const response = await circuit.execute(async () => {
                    const startTime = Date.now();
                    const { adaptiveTimeout, lastScore } = AIOptimizer.getProviderParams(providerId);
                    const effectiveTimeout = policy.trafficClass === 'priority' ? Math.max(adaptiveTimeout, 10000) : adaptiveTimeout;

                    const result = await adapter.invoke(data, effectiveTimeout, requestId);

                    if (!result.success) {
                        // Handle normalized capacity issues
                        if (result.normalizedStatus === 'capacity_limited') {
                            logger.warn(`⚠ Provider capacity isolated { provider: ${providerId}, requestId }`);
                            AIPolicyEngine.reportFailure(providerId, requestId); // Treat as failure for routing
                        }
                        throw new Error(result.data.error || 'Provider execution failed');
                    }

                    // Success handling
                    AIPolicyEngine.reportSuccess(providerId);
                    AIOptimizer.recordPerformance(providerId, Date.now() - startTime, true, requestId);
                    recordAIUsage(providerId, Math.round(result.tokensUsed), requestId);

                    const finalResult = {
                        ...result.data,
                        aiProvider: providerId,
                        governance: { class: policy.trafficClass, timeout: effectiveTimeout },
                        optimizerScore: lastScore.toFixed(2),
                        normalizedStatus: result.normalizedStatus
                    };

                    await pluginManager.runHook('afterAIRoute', { response: finalResult, requestId, metadata });
                    return finalResult;
                }, null, requestId);

                if (response) return response;
            } catch (error) {
                lastError = error;
                AIPolicyEngine.reportFailure(providerId, requestId);
                AIOptimizer.recordPerformance(providerId, 0, false, requestId);
                logger.warn(`⚠ AI Provider (${providerId}) failed — policy routing to next`, { requestId, error: error.message });
            }
        }

        // --- FINAL Fallback ---
        const fallbackAdapter = providerRegistry.get('fallback');
        const fallbackResult = await fallbackAdapter.invoke(data, 8000, requestId);

        const response = {
            ...fallbackResult.data,
            aiProvider: 'fallback',
            fallback: true,
            governance: policy ? { class: policy.trafficClass, timeout: policy.maxTimeout } : { class: 'standard', timeout: 8000 },
            normalizedStatus: fallbackResult.normalizedStatus
        };

        await pluginManager.runHook('afterAIRoute', { response, requestId, metadata });
        return response;
    }

    static getLocalFallback(data, requestId, policy = null) {
        const promptString = typeof data.messages === 'string' ? data.messages : JSON.stringify(data);

        return {
            success: true,
            aiProvider: 'fallback',
            fallback: true,
            governance: policy ? { class: policy.trafficClass, timeout: policy.maxTimeout } : { class: 'standard', timeout: 8000 },
            choices: [{
                message: {
                    content: JSON.stringify({
                        summary: "AI service is currently operating in local fallback mode.",
                        key_findings: ["External AI providers (Gemini/OpenAI) are currently unreachable."],
                        risks: ["Insights may be less detailed than usual."],
                        recommendations: ["Retry the request in a few minutes.", "Check system status dashboard."]
                    })
                }
            }]
        };
    }
}

module.exports = AIGateway;
