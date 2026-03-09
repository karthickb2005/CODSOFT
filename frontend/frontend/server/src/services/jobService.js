const cron = require('node-cron');
const Task = require('../models/Task');
const { getIO } = require('../socket');

/**
 * Initialize background jobs
 */
const initJobs = () => {
    // 1. Scan for overdue tasks every hour
    cron.schedule('0 * * * *', async () => {
        // logger.info('[Background Job] Running overdue task scan...');
        try {
            const overdueTasks = await Task.find({
                status: { $ne: 'done' },
                due_date: { $lt: new Date() }
            });

            if (overdueTasks.length > 0) {
                logger.info(`[Background Job] Found ${overdueTasks.length} overdue tasks.`);

                overdueTasks.forEach(task => {
                    // Notify assignee via socket if online
                    getIO().emit('taskOverdue', {
                        taskId: task._id,
                        taskTitle: task.title,
                        triggeringUser: 'System',
                        affectedUser: task.assignee_email,
                        timestamp: new Date(),
                        eventType: 'taskOverdue'
                    });
                });
            }
        } catch (error) {
            logger.error(`[Background Job] Overdue scan failed: ${error.message}`);
        }
    });

    logger.info('[Background Job] Periodic tasks initialized.');
};

module.exports = {
    initJobs
};
