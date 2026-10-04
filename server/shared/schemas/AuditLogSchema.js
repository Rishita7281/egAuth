const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: String, required: true },
    actorId: { type: String, required: true },
    metadata: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
