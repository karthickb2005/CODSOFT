const logger = require('../../utils/logger');

/**
 * AI Provider Registry
 * Manages active adapters for the TaskPilot platform.
 */
class ProviderRegistry {
    constructor() {
        this.adapters = new Map();
    }

    register(adapter) {
        this.adapters.set(adapter.name, adapter);
        logger.info(`🔌 AI Adapter Registered: ${adapter.name}`);
    }

    get(name) {
        const adapter = this.adapters.get(name);
        if (!adapter) {
            throw new Error(`AI Provider Adapter not found: ${name}`);
        }
        return adapter;
    }

    getAll() {
        return Array.from(this.adapters.values());
    }
}

const registry = new ProviderRegistry();
module.exports = registry;
