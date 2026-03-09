const Project = require('../models/Project');
const Task = require('../models/Task');
const TeamMember = require('../models/TeamMember');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
exports.getDashboardStats = async (req, res) => {
    console.log("[PHASE3_STATS_REQUEST]");

    try {
        // SAFE DEFAULT VALUES
        let activeProjects = 0;
        let totalTasks = 0;
        let myTasks = 0;
        let teamMembers = 0;

        const userEmail = req.user?.email;
        const userId = req.user?.id || req.user?._id;

        // Only fetch if models exist
        // Fetch counts concurrently for performance
        const results = await Promise.allSettled([
            Project.countDocuments({ status: 'active' }),
            Task.countDocuments({}),
            userEmail ? Task.countDocuments({ assignee_email: userEmail }) : Promise.resolve(0),
            TeamMember.countDocuments({ is_active: true })
        ]);

        // Assign results if they succeeded
        if (results[0].status === 'fulfilled') activeProjects = results[0].value;
        if (results[1].status === 'fulfilled') totalTasks = results[1].value;
        if (results[2].status === 'fulfilled') myTasks = results[2].value;
        if (results[3].status === 'fulfilled') teamMembers = results[3].value;

        console.log("[PHASE3_STATS_SUCCESS]");

        return res.status(200).json({
            success: true,
            activeProjects,
            totalTasks,
            myTasks,
            teamMembers
        });

    } catch (err) {
        console.log("[PHASE3_STATS_ERROR]", err.message);

        return res.status(200).json({
            success: true,
            activeProjects: 0,
            totalTasks: 0,
            myTasks: 0,
            teamMembers: 0
        });
    }
};
