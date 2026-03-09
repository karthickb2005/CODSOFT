const mongoose = require('mongoose');

const auditLogSchema = mongoose.Schema(
    {
        actor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        actor_email: {
            type: String,
            required: true,
        },
        action: {
            type: String,
            required: true,
            enum: [
                'TASK_CREATED', 'TASK_UPDATED', 'TASK_DELETED',
                'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_DELETED',
                'USER_LOGIN', 'USER_LOGOUT', 'ROLE_CHANGE',
                'TEAM_MEMBER_ADDED', 'TEAM_MEMBER_REMOVED'
            ],
        },
        entity_type: {
            type: String,
            required: true,
            enum: ['Task', 'Project', 'User', 'TeamMember'],
        },
        entity_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        metadata: {
            before: { type: mongoose.Schema.Types.Mixed },
            after: { type: mongoose.Schema.Types.Mixed },
            details: { type: String },
        },
        ip_address: {
            type: String,
        },
        user_agent: {
            type: String,
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false }, // Logs are immutable, so only createdAt
    }
);

// Ensure logs are immutable at the schema level
auditLogSchema.pre('save', function (next) {
    if (!this.isNew) {
        throw new Error('Audit logs are immutable and cannot be updated.');
    }
    next();
});

// Optimize for activity feeds and audit queries
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ actor_email: 1 });
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
