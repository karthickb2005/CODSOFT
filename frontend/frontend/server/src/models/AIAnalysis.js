const mongoose = require('mongoose');

const aiAnalysisSchema = mongoose.Schema(
    {
        organization_id: {
            type: String,
            default: 'default',
        },
        analysis_type: {
            type: String,
            required: true,
            enum: [
                'workload_balance',
                'delay_prediction',
                'performance_analysis',
                'task_assignment',
                'team_formation',
                'schedule_optimization',
                'bottleneck_detection',
                'burnout_detection'
            ],
        },
        target_entity_type: {
            type: String,
            required: true,
            enum: ['workspace', 'project', 'task', 'member'],
        },
        target_entity_id: {
            type: String,
        },
        results: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        explanation: {
            type: String,
            required: true,
        },
        is_applied: {
            type: Boolean,
            default: false,
        },
        applied_by: {
            type: String,
        },
        applied_at: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('AIAnalysis', aiAnalysisSchema);
