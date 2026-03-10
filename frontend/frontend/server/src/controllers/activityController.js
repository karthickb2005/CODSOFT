const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabaseClient');

// @desc    Get user activity feed
// @route   GET /api/activity
// @access  Private
const getActivityFeed = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from('audit_logs')
        .select(`
            *,
            actor:users(id, name, email)
        `, { count: 'exact' });

    // RBAC: Non-admins can only see their own activity or activity they triggered
    if (req.user.role !== 'admin') {
        const userId = req.user.id || req.user._id;
        query = query.eq('actor_id', userId);
    }

    const { data: logs, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        res.status(500);
        throw new Error(`Supabase Error: ${error.message}`);
    }

    res.status(200).json({
        success: true,
        data: {
            logs,
            page,
            pages: Math.ceil((count || 0) / limit),
            total: count || 0
        }
    });
});

module.exports = {
    getActivityFeed
};
