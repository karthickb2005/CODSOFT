const logger = require('../utils/logger');

class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.hooks = {
            beforeAIRoute: [],
            afterAIRoute: [],
            governanceDecision: [],
            optimizerUpdate: []
        };
    }

    /**
     * Register a new plugin
     * @param {Object} plugin { name, hooks: { [hookName]: fn } }
     */
    registerPlugin(plugin) {
        if (!plugin.name || !plugin.hooks) {
            logger.error(`✖ Failed to register plugin: Invalid structure`, { plugin });
            return;
        }

        this.plugins.set(plugin.name, plugin);

        Object.keys(plugin.hooks).forEach(hookName => {
            if (this.hooks[hookName]) {
                this.hooks[hookName].push({
                    name: plugin.name,
                    fn: plugin.hooks[hookName]
                });
            }
        });

        logger.info(`🔌 Plugin Registered: ${plugin.name}`);
    }

    /**
     * Execute a hook with a timeout safety
     */
    async runHook(hookName, context) {
        if (!this.hooks[hookName] || this.hooks[hookName].length === 0) return;

        for (const hook of this.hooks[hookName]) {
            try {
                // Execute hook with 50ms timeout
                await Promise.race([
                    hook.fn(context),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 50))
                ]);
            } catch (error) {
                logger.warn(`⚠ Plugin Execution Failed { plugin: ${hook.name}, hook: ${hookName}, error: ${error.message} }`, { requestId: context.requestId });
            }
        }
    }

    getPluginStats() {
        return {
            count: this.plugins.size,
            activePlugins: Array.from(this.plugins.keys())
        };
    }
}

// Global instance
const pluginManager = new PluginManager();
module.exports = pluginManager;
