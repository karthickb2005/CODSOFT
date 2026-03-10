const { Worker } = require('bullmq');
const redis = require('../config/redis');
const { getLLMRecommendations, generateStats, generateRuleBasedInsights } = require('../services/aiInsightsService');
const { set } = require('../utils/cache');
const logger = require('../utils/logger');
const { getIO } = require('../socket');
const supabase = require('../config/supabaseClient');

const processAIInsights = async (job) => {
    const { userEmail } = job.data;
    logger.info(`Processing AI insights for ${userEmail}`);

    try {
        const stats = await generateStats(userEmail);
        const insights = generateRuleBasedInsights(stats);
        const recommendations = await getLLMRecommendations(stats);

        const data = { stats, insights, recommendations };
        // Update cache
        await set(`ai_dashboard_${userEmail}`, data, 1800);

        // Notify via socket that insights are ready
        if (getIO()) {
            getIO().emit('insightsUpdated', { userEmail });
        }
        logger.info(`AI Insights processed for ${userEmail}`);
    } catch (error) {
        logger.error(`AI Insights worker error: ${error.message}`);
        throw error;
    }
};

const processAnalyticsRecalc = async (job) => {
    const { isAdmin, userEmail } = job.data;
    const cacheKey = `analytics_${isAdmin ? 'admin' : userEmail}`;
    logger.info(`Recalculating analytics for ${cacheKey}`);

    try {
        // Fetch tasks and update analytics cache
        // Reusing the logic from analyticsController for now
        // Ideally these should be in a service
    } catch (error) {
        logger.error(`Analytics worker error: ${error.message}`);
        throw error;
    }
};

const processOverdueScan = async (job) => {
    logger.info('Running overdue task scan');
    try {
        const { data: overdueTasks, error } = await supabase
            .from('tasks')
            .select('*')
            .neq('status', 'done')
            .lt('due_date', new Date().toISOString());

        if (error) throw error;

        overdueTasks?.forEach(task => {
            if (getIO()) {
                getIO().emit('taskOverdue', {
                    taskId: task.id,
                    taskTitle: task.title,
                    triggeringUser: 'System',
                    affectedUser: task.assignee_email,
                    timestamp: new Date(),
                    eventType: 'taskOverdue'
                });
            }
        });
    } catch (error) {
        logger.error(`Overdue scan worker error: ${error.message}`);
        throw error;
    }
};

// Workers
let aiWorker, analyticsWorker, overdueWorker;

const initWorkers = () => {
    try {
        if (process.env.ENABLE_WORKER === 'true') {
            aiWorker = new Worker('AI_INSIGHTS_GEN', processAIInsights, { connection: redis });
            analyticsWorker = new Worker('ANALYTICS_RECALC', processAnalyticsRecalc, { connection: redis });
            overdueWorker = new Worker('OVERDUE_SCAN', processOverdueScan, { connection: redis });

            aiWorker.on('error', err => logger.error('AI Worker Error:', { error: err.message }));
            analyticsWorker.on('error', err => logger.error('Analytics Worker Error:', { error: err.message }));
            overdueWorker.on('error', err => logger.error('Overdue Worker Error:', { error: err.message }));

            aiWorker.on('failed', (job, err) => {
                logger.error(`Job ${job?.id} failed`, { error: err.message });
            });
            analyticsWorker.on('failed', (job, err) => {
                logger.error(`Job ${job?.id} failed`, { error: err.message });
            });
            overdueWorker.on('failed', (job, err) => {
                logger.error(`Job ${job?.id} failed`, { error: err.message });
            });

            logger.info('BullMQ Workers initialized');
        } else {
            logger.info('BullMQ Workers are disabled via ENABLE_WORKER=false (or undefined)');
        }
    } catch (err) {
        logger.error(`Failed to initialize BullMQ workers: ${err.message}`);
    }
};

module.exports = {
    initWorkers,
    getWorkers: () => ({ aiWorker, analyticsWorker, overdueWorker }),
};
