const cron = require('node-cron');
const supabase = require('../config/supabaseClient');
const { getIO } = require('../socket');

/**
 * Initialize background jobs
 */
const initJobs = () => {
    // 1. Scan for overdue tasks every hour
    cron.schedule('0 * * * *', async () => {
        try {
            const { data: overdueTasks, error } = await supabase
                .from('tasks')
                .select('*')
                .neq('status', 'done')
                .lt('due_date', new Date().toISOString());

            if (error) throw error;

            if (overdueTasks && overdueTasks.length > 0) {
                console.log(`[Background Job] Found ${overdueTasks.length} overdue tasks.`);

                overdueTasks.forEach(task => {
                    // Notify assignee via socket if online
                    getIO().emit('taskOverdue', {
                        taskId: task.id,
                        taskTitle: task.title,
                        triggeringUser: 'System',
                        affectedUser: task.assignee_email,
                        timestamp: new Date(),
                        eventType: 'taskOverdue'
                    });
                });
            }
        } catch (error) {
            console.error(`[Background Job] Overdue scan failed: ${error.message}`);
        }
    });

    console.log('[Background Job] Periodic tasks initialized.');
};

module.exports = {
    initJobs
};
