const db = require('../database');

/**
 * Service to log all administrative actions and data changes
 */
const auditService = {
    /**
     * Log a change to the audit_logs table
     * @param {number} userId - ID of the user performing the action
     * @param {string} action - 'CREATE', 'UPDATE', 'DELETE'
     * @param {string} entity - 'product', 'customer', 'sale', 'user', etc.
     * @param {number} entityId - ID of the record being changed
     * @param {object} changes - Before/After data or specific change details
     * @param {string} ipAddress - IP address of the user
     */
    log: (userId, action, entity, entityId, changes = null, ipAddress = null) => {
        const query = `
            INSERT INTO audit_logs (user_id, action, entity, entity_id, changes, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const params = [
            userId,
            action,
            entity,
            entityId,
            changes ? JSON.stringify(changes) : null,
            ipAddress
        ];

        db.run(query, params, (err) => {
            if (err) {
                console.error('❌ Failed to save audit log:', err.message);
            }
        });
    }
};

module.exports = auditService;
