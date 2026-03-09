const BaseProvider = require('./baseProvider');
const axios = require('axios');
const logger = require('../../utils/logger');

class OpenAIAdapter extends BaseProvider {
    constructor() {
        super('openai');
    }

    async invoke(payload, timeout, requestId) {
        const startTime = Date.now();
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey || apiKey === 'your_openai_key' || apiKey.startsWith('sk-dummy')) {
            throw new Error('OpenAI API Key not configured or invalid');
        }

        try {
            const res = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: "gpt-3.5-turbo",
                messages: Array.isArray(payload.messages) ? payload.messages : [{ role: 'user', content: payload.messages }],
                max_tokens: 500
            }, {
                headers: { 'Authorization': `Bearer ${apiKey}` },
                timeout: timeout || 8000
            });

            const latency = Date.now() - startTime;
            const tokens = res.data.usage?.total_tokens || 0;
            const content = res.data.choices[0].message.content;

            return this.formatResponse(true, { content }, latency, tokens);
        } catch (error) {
            const latency = Date.now() - startTime;
            const status = this.normalizeError(error);
            logger.error(`✖ OpenAI Adapter Error: ${error.message}`, { requestId, status });
            return this.formatResponse(false, { error: error.message }, latency, 0, status);
        }
    }
}

module.exports = OpenAIAdapter;
