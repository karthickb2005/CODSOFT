const mongoose = require('mongoose');

const taskSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Please add a task title'],
        },
        description: {
            type: String,
        },
        status: {
            type: String,
            enum: ['todo', 'in_progress', 'done', 'review', 'backlog'],
            default: 'todo',
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium',
        },
        difficulty: {
            type: String,
            enum: ['trivial', 'easy', 'medium', 'hard', 'complex'],
            default: 'medium',
        },
        domain: {
            type: String,
            default: 'other',
        },
        project_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
        },
        assignee_email: {
            type: String,
        },
        reviewer_email: {
            type: String,
        },
        start_date: {
            type: Date,
        },
        due_date: {
            type: Date,
        },
        completed_date: {
            type: Date,
        },
        estimated_hours: {
            type: Number,
        },
        required_skills: {
            type: [String],
            default: [],
        },
        tags: {
            type: [String],
            default: [],
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Optimize for common queries and analytics
taskSchema.index({ assignee_email: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ due_date: 1 });
taskSchema.index({ createdAt: 1 }); // For timeline and throughput trends

module.exports = mongoose.model('Task', taskSchema);
