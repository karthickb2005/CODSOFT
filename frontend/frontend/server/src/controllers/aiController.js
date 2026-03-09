const asyncHandler = require('express-async-handler');
const axios = require('axios');
const AIAnalysis = require('../models/AIAnalysis');
const { generateStats, generateRuleBasedInsights, getLLMRecommendations } = require('../services/aiInsightsService');
const { getOrSet, get } = require('../utils/cache');
const { protect } = require('../middleware/authMiddleware');

// Initialize Hugging Face
const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;
const HF_MODEL = "meta-llama/Llama-3.1-8B-Instruct";

// @desc    Get AI insights from database
// @route   GET /api/ai-insights
// @access  Public
const getInsights = asyncHandler(async (req, res) => {
    const { orderBy = '-createdAt', limit = 50 } = req.query;

    const sortField = orderBy.startsWith('-') ? orderBy.substring(1) : orderBy;
    const sortOrder = orderBy.startsWith('-') ? -1 : 1;

    const insights = await AIAnalysis.find()
        .sort({ [sortField]: sortOrder })
        .limit(parseInt(limit));

    res.status(200).json({ success: true, data: insights });
});

// @desc    Create/Save AI insight
// @route   POST /api/ai-insights
// @access  Public
const createInsight = asyncHandler(async (req, res) => {
    const insight = await AIAnalysis.create(req.body);
    res.status(201).json({ success: true, data: insight });
});

// @desc    Invoke Hugging Face LLM for analysis
// @route   POST /api/ai-insights/invoke
// @access  Public
const invokeLLM = asyncHandler(async (req, res) => {
    const { prompt: inputData } = req.body;

    if (!HF_API_KEY) {
        return res.status(500).json({
            error: 'HUGGING_FACE_API_KEY is not configured on the server.',
            recommendation: 'Please add HUGGING_FACE_API_KEY to your server/.env file'
        });
    }

    const fullPrompt = `You are an AI insights engine used in a production backend service.

Your task is to analyze the provided input data and generate clear, actionable insights.

STRICT RULES:
- Return ONLY valid JSON.
- Do NOT include explanations, markdown, or extra text.
- Follow the schema exactly.
- Use concise, professional language.

JSON SCHEMA:
{
  "summary": "High-level overview in 1–2 sentences",
  "key_findings": [
    "Observation 1",
    "Observation 2",
    "Observation 3"
  ],
  "risks": [
    "Identified risk 1",
    "Identified risk 2"
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2"
  ]
}

INPUT DATA:
${typeof inputData === 'string' ? inputData : JSON.stringify(inputData, null, 2)}`;

    const { postAIRequest } = require('../utils/aiClient');

    const result = await postAIRequest(
        'https://router.huggingface.co/v1/chat/completions',
        {
            model: HF_MODEL,
            messages: [{ role: 'user', content: fullPrompt }],
            max_tokens: 1000,
            stream: false
        },
        {
            Authorization: `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/json',
        },
        req.requestId
    );

    if (result.success === false) {
        return res.status(503).json(result);
    }

    const text = result.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : text;

    try {
        const jsonResponse = JSON.parse(jsonString);
        res.status(200).json({
            success: true,
            data: jsonResponse
        });
    } catch (parseError) {
        res.status(500).json({
            error: 'AI returned invalid JSON structure',
            raw_text: text
        });
    }
});

// @desc    Update AI insight (apply/dismiss)
// @route   PUT /api/ai-insights/:id
// @access  Public
const updateInsight = asyncHandler(async (req, res) => {
    const insight = await AIAnalysis.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!insight) {
        res.status(404);
        throw new Error('Insight not found');
    }

    res.status(200).json({ success: true, data: insight });
});

// @desc    Get dashboard insights (stats + rule-based + AI)
// @route   GET /api/ai-insights/dashboard
// @access  Private
const getDashboardInsights = asyncHandler(async (req, res) => {
    const userEmail = req.user.email;
    const cacheKey = `ai_dashboard_${userEmail}`;

    const cachedData = await get(cacheKey);

    if (cachedData) {
        return res.status(200).json(cachedData);
    }

    // Cache miss: Trigger background job
    const { aiInsightsQueue } = require('../queue/queue');
    try {
        await aiInsightsQueue.add(`ai_insights_${userEmail}`, { userEmail });
    } catch (queueError) {
        console.warn('AI insights queue unavailable (Redis down). Skipping background update.');
    }

    // Return current stats (fast) + placeholder for insights
    const stats = await generateStats(userEmail);
    const insights = generateRuleBasedInsights(stats);

    res.status(202).json({
        success: true,
        message: 'Insights are being generated in the background',
        data: {
            stats,
            insights,
            recommendations: ["Insights are being generated in the background. Please refresh in a few seconds."],
            isProcessing: true
        }
    });
});

module.exports = {
    getInsights,
    createInsight,
    invokeLLM,
    updateInsight,
    getDashboardInsights,
};
