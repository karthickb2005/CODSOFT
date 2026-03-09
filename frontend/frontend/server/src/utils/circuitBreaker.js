const logger = require('./logger');

let AIEventStream;
try {
    AIEventStream = require('../services/aiEventStream');
} catch (e) {
    // Service might not be available during early bootstrap
}

class CircuitBreaker {
    constructor(serviceName, options = {}) {
        this.serviceName = serviceName;
        this.failureThreshold = options.failureThreshold || 5;
        this.recoveryTimeout = options.recoveryTimeout || 30000; // 30s

        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.nextAttempt = 0;
    }

    async execute(action, fallback = null, requestId = null) {
        if (this.state === 'OPEN') {
            if (Date.now() > this.nextAttempt) {
                this.state = 'HALF_OPEN';
                logger.info(`⚠ Circuit Half-Open Recovery: Attempting to probe ${this.serviceName}`, { requestId });
            } else {
                logger.warn(`⚠ Circuit Open: Skipping request to ${this.serviceName}`, { requestId, state: 'circuit_open' });
                if (fallback) return fallback();
                throw new Error(`Service ${this.serviceName} is currently unavailable (Circuit Open)`);
            }
        }

        try {
            const result = await action();
            this.onSuccess(requestId);
            return result;
        } catch (error) {
            this.onFailure(error, requestId);
            if (fallback) return fallback();
            throw error;
        }
    }

    onSuccess(requestId) {
        if (this.state !== 'CLOSED') {
            logger.info(`✔ Service recovered: ${this.serviceName} - Circuit CLOSED`, { requestId });
            if (AIEventStream) AIEventStream.publishCircuitStateChange(this.serviceName, 'CLOSED', requestId);
        }
        this.state = 'CLOSED';
        this.failureCount = 0;
    }

    onFailure(error, requestId) {
        this.failureCount++;
        logger.error(`✖ Service failure: ${this.serviceName} [Count: ${this.failureCount}] - ${error.message}`, { requestId });

        if (this.failureCount >= this.failureThreshold || this.state === 'HALF_OPEN') {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.recoveryTimeout;
            logger.error(`⚠ Circuit OPENED for ${this.serviceName}. Service will be skipped for ${this.recoveryTimeout / 1000}s.`, { requestId, state: 'circuit_open' });
            if (AIEventStream) AIEventStream.publishCircuitStateChange(this.serviceName, 'OPEN', requestId);
        }
    }
}

module.exports = CircuitBreaker;
