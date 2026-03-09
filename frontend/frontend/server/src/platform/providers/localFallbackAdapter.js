const BaseProvider = require('./baseProvider');

class LocalFallbackAdapter extends BaseProvider {
    constructor() {
        super('fallback');
    }

    async invoke(payload, timeout, requestId) {
        const startTime = Date.now();

        const content = JSON.stringify({
            message: "This is a local fallback response. The primary AI providers are currently unavailable or busy.",
            original_request: payload.messages,
            timestamp: new Date().toISOString()
        });

        const latency = Date.now() - startTime;
        return this.formatResponse(true, { content }, latency, 0, 'fallback');
    }
}

module.exports = LocalFallbackAdapter;
