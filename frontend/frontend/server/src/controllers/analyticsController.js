const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabaseClient');
const { getOrSet } = require('../utils/cache');

// @desc    Get system-wide or user-specific analytics
// @route   GET /api/analytics
// @access  Private
const getAnalytics = asyncHandler(async (req, res) => {
    const isAdmin = req.user.role === 'admin';
    const userEmail = req.user.email;
    const cacheKey = `analytics_${isAdmin ? 'admin' : userEmail}`;

    const analyticsData = await getOrSet(cacheKey, async () => {
        // Fetch tasks based on role
        let query = supabase.from('tasks').select('*');
        if (!isAdmin) {
            query = query.eq('assignee_email', userEmail);
        }

        const { data: tasks, error } = await query;
        if (error) throw error;

        // 1. Task Throughput (Monthly)
        const monthlyMap = {};
        tasks.forEach(task => {
            const month = new Date(task.created_at).getMonth() + 1; // 1-12
            if (!monthlyMap[month]) monthlyMap[month] = { _id: month, count: 0, completed: 0 };
            monthlyMap[month].count++;
            if (task.status === 'done') monthlyMap[month].completed++;
        });
        const monthlyThroughput = Object.values(monthlyMap).sort((a, b) => a._id - b._id);

        // 2. Priority Distribution
        const priorityMap = {};
        tasks.forEach(task => {
            const priority = task.priority || 'medium';
            if (!priorityMap[priority]) priorityMap[priority] = { _id: priority, count: 0 };
            priorityMap[priority].count++;
        });
        const priorityDist = Object.values(priorityMap);

        // 3. User Productivity (Admin Only)
        let userProductivity = [];
        if (isAdmin) {
            const userMap = {};
            tasks.forEach(task => {
                const email = task.assignee_email || 'Unassigned';
                if (!userMap[email]) userMap[email] = { _id: email, total: 0, completed: 0 };
                userMap[email].total++;
                if (task.status === 'done') userMap[email].completed++;
            });
            userProductivity = Object.values(userMap)
                .sort((a, b) => b.completed - a.completed)
                .slice(0, 10);
        }

        return {
            monthlyThroughput,
            priorityDist,
            userProductivity
        };
    }, 900); // 15 mins TTL

    res.status(200).json({
        success: true,
        data: analyticsData
    });
});

module.exports = {
    getAnalytics
};
