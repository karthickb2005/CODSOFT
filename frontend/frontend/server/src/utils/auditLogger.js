const AuditLog = require('../models/AuditLog');

/**
 * Record an audit log entry
 * @param {Object} params
 * @param {string} params.userId - The ID of the user performing the action
 * @param {string} params.userEmail - The email of the user performing the action
 * @param {string} params.action - The action being performed (e.g., 'TASK_CREATED')
 * @param {string} params.entityType - The type of entity (e.g., 'Task')
 * @param {string} params.entityId - The ID of the entity
 * @param {Object} [params.metadata] - Optional metadata (before/after states)
 * @param {string} [params.ipAddress] - Optional IP address
 * @param {string} [params.userAgent] - Optional User Agent
 */
const logAction = async ({
    userId,
    userEmail,
    action,
    entityType,
    entityId,
    metadata = {},
    ipAddress,
    userAgent
}) => {
    try {
        await AuditLog.create({
            actor: userId,
            actor_email: userEmail,
            action,
            entity_type: entityType,
            entity_id: entityId,
            metadata,
            ip_address: ipAddress,
            user_agent: userAgent
        });
    } catch (error) {
        console.error('Failed to create audit log:', error.message);
        // We don't throw here to avoid blocking the main core flow
    }
};

module.exports = {
    logAction
};
