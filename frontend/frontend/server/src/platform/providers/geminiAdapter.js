const BaseProvider = require('./baseProvider');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../../utils/logger');

class GeminiAdapter extends BaseProvider {
    constructor() {
        super('gemini');
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    async invoke(payload, timeout, requestId) {
        const startTime = Date.now();
        try {
            // Transform messages to Gemini format if needed
            const prompt = payload.messages?.[0]?.content || payload.messages || "Hello";

            // Note: In real app, we'd use AbortController for timeout
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const latency = Date.now() - startTime;
            const tokens = response.usageMetadata?.totalTokenCount || text.length / 4;

            return this.formatResponse(true, { content: text }, latency, tokens);
        } catch (error) {
            const latency = Date.now() - startTime;
            const status = this.normalizeError(error);
            logger.error(`✖ Gemini Adapter Error: ${error.message}`, { requestId, status });
            return this.formatResponse(false, { error: error.message }, latency, 0, status);
        }
    }
}

module.exports = GeminiAdapter;
