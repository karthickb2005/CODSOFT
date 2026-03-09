const mongoose = require('mongoose');

const skillSchema = mongoose.Schema({
    name: { type: String, required: true },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'intermediate'
    },
    years_experience: { type: Number }
});

const teamMemberSchema = mongoose.Schema(
    {
        user_email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
        },
        organization_id: {
            type: String,
            required: true,
            default: 'default'
        },
        display_name: {
            type: String,
        },
        avatar_url: {
            type: String,
        },
        role: {
            type: String,
            enum: ['admin', 'team_leader', 'member'],
            default: 'member'
        },
        job_title: {
            type: String,
        },
        department: {
            type: String,
        },
        skills: [skillSchema],
        domains: [String],
        availability: {
            hours_per_week: { type: Number, default: 40 },
            timezone: { type: String },
            work_days: [Number]
        },
        current_workload: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        max_concurrent_tasks: {
            type: Number,
            default: 5
        },
        active_task_ids: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task'
        }],
        performance_metrics: {
            tasks_completed: { type: Number, default: 0 },
            on_time_rate: { type: Number, default: 0 },
            avg_quality_score: { type: Number, default: 0 },
            productivity_score: { type: Number, default: 0 },
            consistency_score: { type: Number, default: 0 },
            contribution_score: { type: Number, default: 0 }
        },
        burnout_risk: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'low'
        },
        last_active: {
            type: Date,
            default: Date.now
        },
        is_active: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('TeamMember', teamMemberSchema);
