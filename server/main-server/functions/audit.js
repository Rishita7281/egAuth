const AuditLog = require('../../shared/schemas/AuditLogSchema');

const logAudit = async ({ action, targetType, targetId, actorId, metadata = {} }) => {
  try {
    await AuditLog.create({ action, targetType, targetId, actorId, metadata });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { logAudit };
