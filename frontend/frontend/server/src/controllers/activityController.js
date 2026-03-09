const asyncHandler = require('express-async-handler');
const AuditLog = require('../models/AuditLog');

// @desc    Get user activity feed
// @route   GET /api/activity
// @access  Private
const getActivityFeed = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = {};

    // RBAC: Non-admins can only see their own activity or activity they triggered
    if (req.user.role !== 'admin') {
        query = { actor: req.user.id || req.user._id };
    }

    const logs = await AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actor', 'name email');

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
        success: true,
        data: {
            logs,
            page,
            pages: Math.ceil(total / limit),
            total
        }
    });
});

module.exports = {
    getActivityFeed
};
