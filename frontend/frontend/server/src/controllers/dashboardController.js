const supabase = require('../config/supabaseClient');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
exports.getDashboardStats = async (req, res) => {
    try {
        const userEmail = req.user?.email;

        const [
            { count: activeProjects },
            { count: totalTasks },
            myTasksResult,
            { count: teamMembers }
        ] = await Promise.all([
            supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
            supabase.from('tasks').select('*', { count: 'exact', head: true }),
            userEmail
                ? supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('assignee_email', userEmail)
                : Promise.resolve({ count: 0 }),
            supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('is_active', true)
        ]);

        return res.status(200).json({
            success: true,
            activeProjects: activeProjects || 0,
            totalTasks: totalTasks || 0,
            myTasks: myTasksResult?.count || 0,
            teamMembers: teamMembers || 0
        });

    } catch (err) {
        console.error("[DASHBOARD_STATS_ERROR]", err.message);
        return res.status(200).json({
            success: true,
            activeProjects: 0,
            totalTasks: 0,
            myTasks: 0,
            teamMembers: 0
        });
    }
};
