const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    },
    admin_email: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true
    },
    target_type: {
      type: String,
      required: true
    },
    target_id: {
      type: String,
      required: false
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ip_address: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ admin_email: 1 });
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);

