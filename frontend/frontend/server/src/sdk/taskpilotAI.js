const axios = require('axios');

/**
 * TaskPilot AI SDK
 * Unified interface for external apps to leverage the TaskPilot AI control plane.
 */
class TaskPilotAI {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || 'http://localhost:5000/api/system';
        this.tenantId = config.tenantId || 'global';
        this.apiKey = config.apiKey;
    }

    /**
     * Invoke AI through the TaskPilot Orchestration Layer
     */
    async invokeAI(prompt, metadata = {}) {
        try {
            const response = await axios.post(`${this.baseUrl.replace('/system', '/ai')}/invoke`, {
                messages: prompt,
                ...metadata
            }, {
                headers: {
                    'x-tenant-id': this.tenantId,
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            return response.data;
        } catch (error) {
            throw new Error(`TaskPilotAI SDK Error: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Get Provider status from the control plane
     */
    async getProviderStatus() {
        const res = await axios.get(`${this.baseUrl}/metrics`);
        return res.data.data.aiOptimizer.rankings;
    }

    /**
     * Request a routing simulation
     */
    async runSimulation(batchSize = 10) {
        const res = await axios.post(`${this.baseUrl}/simulation/run`, { batchSize });
        return res.data.data;
    }
}

module.exports = TaskPilotAI;
