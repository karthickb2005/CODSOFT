const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabaseClient');
const { generateStats, generateRuleBasedInsights } = require('../services/aiInsightsService');
const { get } = require('../utils/cache');

// Initialize Hugging Face
const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;
const HF_MODEL = "meta-llama/Llama-3.1-8B-Instruct";

// @desc    Get AI insights from database
// @route   GET /api/ai-insights
// @access  Public
const getInsights = asyncHandler(async (req, res) => {
    const { orderBy = '-created_at', limit = 50 } = req.query;

    const isDescending = orderBy.startsWith('-');
    const field = isDescending ? orderBy.substring(1) : orderBy;
    const sortField = field === 'createdAt' ? 'created_at' : field;

    const { data: insights, error } = await supabase
        .from('ai_insights')
        .select('*')
        .order(sortField, { ascending: !isDescending })
        .limit(parseInt(limit));

    if (error) {
        res.status(500);
        throw new Error(`Supabase Error: ${error.message}`);
    }

    res.status(200).json({ success: true, data: insights });
});

// @desc    Create/Save AI insight
// @route   POST /api/ai-insights
// @access  Public
const createInsight = asyncHandler(async (req, res) => {
    const { data: insight, error } = await supabase
        .from('ai_insights')
        .insert([req.body])
        .select()
        .single();

    if (error) {
        res.status(500);
        throw new Error(`Failed to save insight: ${error.message}`);
    }

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
            recommendation: 'Please add HUGGING_FACE_API_KEY to your env'
        });
    }

    const fullPrompt = `You are an AI insights engine. Analyze the input. Return ONLY valid JSON matching schema: {summary, key_findings:[], risks:[], recommendations:[]}. Input: ${JSON.stringify(inputData)}`;

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

// @desc    Update AI insight
// @route   PUT /api/ai-insights/:id
// @access  Public
const updateInsight = asyncHandler(async (req, res) => {
    const { data: insight, error } = await supabase
        .from('ai_insights')
        .update(req.body)
        .eq('id', req.params.id)
        .select()
        .single();

    if (error || !insight) {
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
    if (cachedData) return res.status(200).json(cachedData);

    // Placeholder background update attempt
    try {
        const { aiInsightsQueue } = require('../queue/queue');
        if (aiInsightsQueue) {
            await aiInsightsQueue.add(`ai_insights_${userEmail}`, { userEmail });
        }
    } catch (queueError) {
        console.warn('AI insights queue unavailable (Expected on Vercel).');
    }

    const stats = await generateStats(userEmail);
    const insights = generateRuleBasedInsights(stats);

    res.status(202).json({
        success: true,
        message: 'Insights generation initiated',
        data: {
            stats,
            insights,
            recommendations: ["Insights are being updated. Please refresh shortly."],
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
