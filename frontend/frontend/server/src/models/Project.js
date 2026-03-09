const mongoose = require('mongoose');

const projectSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a project name'],
        },
        description: {
            type: String,
        },
        status: {
            type: String,
            enum: ['active', 'planning', 'completed', 'on_hold'],
            default: 'planning',
        },
        health_status: {
            type: String,
            enum: ['excellent', 'good', 'at_risk', 'critical'],
            default: 'good',
        },
        progress: {
            type: Number,
            default: 0,
        },
        target_end_date: {
            type: Date,
        },
        member_emails: {
            type: [String],
            default: [],
        },
        owner_email: {
            type: String,
        },
        is_archived: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true,
    }
);

// Optimize for common queries
projectSchema.index({ owner_email: 1 });
projectSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Project', projectSchema);
