const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');
const { getOrSet } = require('../utils/cache');

// @desc    Get system-wide or user-specific analytics
// @route   GET /api/analytics
// @access  Private
const getAnalytics = asyncHandler(async (req, res) => {
    const isAdmin = req.user.role === 'admin';
    const userEmail = req.user.email;
    const cacheKey = `analytics_${isAdmin ? 'admin' : userEmail}`;

    const analyticsData = await getOrSet(cacheKey, async () => {
        // 1. Task Throughput (Monthly)
        const monthlyThroughput = await Task.aggregate([
            {
                $match: isAdmin ? {} : { assignee_email: userEmail }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] }
                    }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // 2. Priority Distribution
        const priorityDist = await Task.aggregate([
            {
                $match: isAdmin ? {} : { assignee_email: userEmail }
            },
            {
                $group: {
                    _id: "$priority",
                    count: { $sum: 1 }
                }
            }
        ]);

        // 3. User Productivity (Admin Only)
        let userProductivity = [];
        if (isAdmin) {
            userProductivity = await Task.aggregate([
                {
                    $group: {
                        _id: "$assignee_email",
                        total: { $sum: 1 },
                        completed: {
                            $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] }
                        }
                    }
                },
                { $limit: 10 }
            ]);
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
