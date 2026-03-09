const Task = require('../models/Task');
const AIAnalysis = require('../models/AIAnalysis');
const axios = require('axios');

const generateStats = async (userEmail) => {
    const tasks = await Task.find({ assignee_email: userEmail });

    const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'done').length,
        pending: tasks.filter(t => t.status !== 'done').length,
        overdue: tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()).length,
        highPriority: tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length,
        byPriority: {
            low: tasks.filter(t => t.priority === 'low').length,
            medium: tasks.filter(t => t.priority === 'medium').length,
            high: tasks.filter(t => t.priority === 'high').length,
            urgent: tasks.filter(t => t.priority === 'urgent').length,
        },
        byStatus: {
            todo: tasks.filter(t => t.status === 'todo').length,
            in_progress: tasks.filter(t => t.status === 'in_progress').length,
            done: tasks.filter(t => t.status === 'done').length,
            review: tasks.filter(t => t.status === 'review').length,
            backlog: tasks.filter(t => t.status === 'backlog').length,
        }
    };

    return stats;
};

const generateRuleBasedInsights = (stats) => {
    const insights = [];

    if (stats.overdue > 0) {
        insights.push({
            type: 'warning',
            text: `You have ${stats.overdue} overdue tasks. Prioritize completing these to maintain momentum.`
        });
    }

    if (stats.highPriority > 3) {
        insights.push({
            type: 'critical',
            text: `You have ${stats.highPriority} high-priority tasks pending. Consider delegating or focusing solely on these today.`
        });
    }

    if (stats.byStatus.in_progress > 5) {
        insights.push({
            type: 'info',
            text: `Working on ${stats.byStatus.in_progress} tasks simultaneously might reduce focus. Try to finish one before starting another.`
        });
    }

    if (stats.total > 0 && stats.completed === stats.total) {
        insights.push({
            type: 'success',
            text: "All clear! You've completed all your assigned tasks. Great job!"
        });
    } else if (stats.completed / stats.total > 0.8) {
        insights.push({
            type: 'success',
            text: "Excellent progress! You've completed over 80% of your tasks."
        });
    }

    return insights;
};

const getLLMRecommendations = async (stats, requestId = null) => {
    const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;
    if (!HF_API_KEY) return null;

    const prompt = `Analyze these task statistics for a user and provide 3 concise, actionable productivity tips.
    Stats: ${JSON.stringify(stats)}
    
    Format: Return ONLY a JSON object with a "recommendations" array of strings.`;

    const { postAIRequest } = require('../utils/aiClient');

    const result = await postAIRequest(
        'https://router.huggingface.co/v1/chat/completions',
        {
            model: "meta-llama/Llama-3.1-8B-Instruct",
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 500,
        },
        { Authorization: `Bearer ${HF_API_KEY}` },
        requestId
    );

    if (!result || result.success === false) {
        logger.warn('AI Insights fallback triggered in background service');
        return null;
    }

    try {
        const text = result.choices[0].message.content;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : text).recommendations;
    } catch (error) {
        logger.error('Failed to parse background AI recommendations:', error.message);
        return null;
    }
};

module.exports = {
    generateStats,
    generateRuleBasedInsights,
    getLLMRecommendations
};
