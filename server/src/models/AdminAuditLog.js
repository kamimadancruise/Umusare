const mongoose = require("mongoose");

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, trim: true, required: true, index: true },
    targetType: { type: String, trim: true, required: true, index: true },
    targetId: { type: String, trim: true, required: true, index: true },
    description: { type: String, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

adminAuditLogSchema.index({ adminUserId: 1, createdAt: -1 });
adminAuditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

module.exports = mongoose.model("AdminAuditLog", adminAuditLogSchema);
