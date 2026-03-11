/**
 * Audit Logging Utility
 * Logs all user actions for admin review
 */

const db = require('../database');

/**
 * Log an action to the audit_logs table
 * @param {Object} options
 * @param {number} options.userId - ID of the user performing the action
 * @param {string} options.userName - Name of the user
 * @param {string} options.userRole - Role of the user (admin, teacher, secretary)
 * @param {string} options.action - Action performed (CREATE, UPDATE, DELETE, LOGIN, VIEW, etc.)
 * @param {string} options.entityType - Type of entity affected (student, subject, user, payment, grade, etc.)
 * @param {number} options.entityId - ID of the entity affected (optional)
 * @param {string} options.entityName - Name/description of the entity (optional)
 * @param {string} options.details - Additional details (optional)
 * @param {string} options.ipAddress - IP address of the request (optional)
 */
async function logAction(options) {
    const {
        userId,
        userName,
        userRole,
        action,
        entityType,
        entityId = null,
        entityName = null,
        details = null,
        ipAddress = null
    } = options;

    try {
        await db.query(`
            INSERT INTO audit_logs (
                user_id, user_name, user_role, action, 
                entity_type, entity_id, entity_name, details, ip_address
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            userId,
            userName,
            userRole,
            action,
            entityType,
            entityId,
            entityName,
            details,
            ipAddress
        ]);
    } catch (err) {
        console.error('Error logging audit action:', err);
    }
}

/**
 * Get IP address from request
 */
function getClientIp(req) {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           req.connection.socket?.remoteAddress ||
           'unknown';
}

/**
 * Middleware to extract and store request info for logging
 */
function auditMiddleware(req, res, next) {
    req.auditLog = {
        userId: req.session.user?.id,
        userName: req.session.user?.name || 'Anonymous',
        userRole: req.session.user?.role,
        ipAddress: getClientIp(req)
    };
    next();
}

module.exports = {
    logAction,
    getClientIp,
    auditMiddleware
};
