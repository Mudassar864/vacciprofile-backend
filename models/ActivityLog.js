const mongoose = require('mongoose');

const RETENTION_DAYS = Math.max(1, Number(process.env.ACTIVITY_LOG_RETENTION_DAYS || 365));

/**
 * Audit trail of admin writes. Entries expire automatically (TTL index) so the
 * collection stays bounded no matter how much editing happens.
 */
const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    userName: { type: String, default: '' },
    userEmail: { type: String, default: '' },
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'bulk-delete', 'import', 'login', 'password-change'],
      required: true,
    },
    entity: { type: String, required: true },
    entityId: { type: String, default: '' },
    label: { type: String, default: '' },
    method: { type: String, default: '' },
    path: { type: String, default: '' },
    status: { type: Number },
    ip: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// The TTL index also serves "newest first" sorts (indexes can be walked in reverse).
activityLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: RETENTION_DAYS * 24 * 60 * 60, name: 'ttl_createdAt' }
);
activityLogSchema.index({ entity: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
