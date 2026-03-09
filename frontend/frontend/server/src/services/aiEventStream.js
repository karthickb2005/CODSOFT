const { getIO } = require('../socket');
const logger = require('../utils/logger');

/**
 * AI Event Streamer
 * Coordinates broadcasting of real-time AI events to authenticated clients in the 'ai-ops' room.
 */
class AIEventStream {
    static emit(type, payload, requestId = null) {
        try {
            const io = getIO();
            const event = {
                type,
                timestamp: new Date().toISOString(),
                requestId,
                ...payload
            };

            // Broadcast to the 'ai-ops' room only
            io.to('ai-ops').emit('ai_event', event);

            logger.debug(`📡 AI Event Streamed: ${type}`, { requestId });
        } catch (error) {
            // Non-blocking: fail silently if IO not initialized during bootstrap
            logger.debug(`Skipping AI Event Stream: ${error.message}`);
        }
    }

    // Specific event helpers
    static publishOptimizerUpdate(rankings, stats) {
        this.emit('optimizerUpdate', { rankings, stats });
    }

    static publishPolicyDecision(decision, requestId) {
        this.emit('policyDecision', { decision }, requestId);
    }

    static publishProviderBlacklist(provider, reason, cooldown) {
        this.emit('providerBlacklist', { provider, reason, cooldown });
    }

    static publishCircuitStateChange(serviceName, state, requestId) {
        this.emit('circuitStateChange', { serviceName, state }, requestId);
    }

    static publishSimulationComplete(report) {
        this.emit('simulationComplete', { report });
    }

    static publishProviderDegraded(provider, status, requestId) {
        this.emit('providerDegraded', { provider, status }, requestId);
    }

    static publishProviderRecovered(provider) {
        this.emit('providerRecovered', { provider });
    }
}

module.exports = AIEventStream;
