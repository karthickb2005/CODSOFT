const logger = require('../utils/logger');
const pluginManager = require('../platform/pluginManager');

const governanceState = {
    policies: {
        priorityUsers: ['admin@taskpilot.ai', 'premium-dev@example.com'],
        consecutiveFailureThreshold: 5,
        blacklistCooldownMs: 300000 // 5 minutes
    },
    blacklist: {}, // { provider: expiryTimestamp }
    providerFailures: {
        gemini: 0,
        openai: 0
    }
};

class AIPolicyEngine {
    /**
     * Classify request and apply governance rules
     */
    static getRoutingPolicy(requestId, metadata = {}) {
        const tenantId = metadata.tenantId || 'global';

        // Multi-tenant profile lookup (mock profiles for platform mode)
        const tenantProfiles = {
            'enterprise': { maxLatencySLA: 4000, consecutiveFailureThreshold: 3 },
            'startup': { maxLatencySLA: 10000, consecutiveFailureThreshold: 8 },
            'global': governanceState.policies
        };

        const activeRules = tenantProfiles[tenantId] || tenantProfiles['global'];

        const isPriority = (metadata.userId && governanceState.policies.priorityUsers.includes(metadata.userId)) ||
            (metadata.email && governanceState.policies.priorityUsers.includes(metadata.email));

        const activeBlacklist = Object.keys(governanceState.blacklist).filter(p => {
            return governanceState.blacklist[p] > Date.now();
        });

        const decision = {
            trafficClass: isPriority ? 'priority' : 'standard',
            maxTimeout: isPriority ? 12000 : 8000,
            preferredProvider: isPriority ? 'premium' : 'any',
            blacklist: activeBlacklist,
            tenantId,
            rulesApplied: activeRules
        };

        // PLATFORM HOOK: Allow external policy injection
        pluginManager.runHook('governanceDecision', { decision, requestId, metadata });

        const AIEventStream = require('./aiEventStream');
        AIEventStream.publishPolicyDecision(decision, requestId);

        logger.info(`🧭 Policy Engine decision { class: ${decision.trafficClass}, tenant: ${tenantId}, blacklistCount: ${activeBlacklist.length}, requestId: ${requestId} }`);
        return decision;
    }

    /**
     * Autonomous failure tracking and blacklisting
     */
    static reportFailure(provider, requestId) {
        if (!governanceState.providerFailures[provider] && governanceState.providerFailures[provider] !== 0) return;

        governanceState.providerFailures[provider]++;

        if (governanceState.providerFailures[provider] >= governanceState.policies.consecutiveFailureThreshold) {
            const expiry = Date.now() + governanceState.policies.blacklistCooldownMs;
            governanceState.blacklist[provider] = expiry;
            governanceState.providerFailures[provider] = 0; // Reset counter

            const AIEventStream = require('./aiEventStream');
            AIEventStream.publishProviderBlacklist(provider, 'Consecutive failures', '5m');

            logger.warn(`⚠ Provider blacklisted { provider: ${provider}, reason: 'Consecutive failures', cooldown: '5m', requestId: ${requestId} }`);
        }
    }

    static reportSuccess(provider) {
        if (governanceState.providerFailures[provider]) {
            governanceState.providerFailures[provider] = 0; // Reset on success (circuit-breaker style)
        }
    }

    static updatePolicies(newPolicies) {
        if (!newPolicies) return;
        Object.keys(newPolicies).forEach(key => {
            if (governanceState.policies.hasOwnProperty(key)) {
                governanceState.policies[key] = newPolicies[key];
                logger.info(`🧭 Policy Engine: Updated ${key} to ${newPolicies[key]}`);
            }
        });
    }

    static getMetrics() {
        return {
            activePolicies: governanceState.policies,
            providerBlacklist: Object.keys(governanceState.blacklist),
            failureCounters: governanceState.providerFailures
        };
    }
}

module.exports = AIPolicyEngine;
