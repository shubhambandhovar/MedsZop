const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["admin", "customer", "pharmacy", "delivery", "doctor"],
    default: "customer",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActivityAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  absoluteExpiresAt: {
    type: Date,
    required: true,
  },
  idleTimeoutMs: {
    type: Number,
    required: true,
  },
  isValid: {
    type: Boolean,
    default: true,
    index: true,
  },
  ipAddress: {
    type: String,
    default: "",
  },
  userAgent: {
    type: String,
    default: "",
  },
  deviceType: {
    type: String,
    default: "desktop",
  },
  revokedAt: {
    type: Date,
    default: null,
  },
  revocationReason: {
    type: String,
    default: "",
  },
});

// Compound index for querying user's active sessions
sessionSchema.index({ userId: 1, isValid: 1 });

// TTL Index: Automatically purge document after absoluteExpiresAt is reached
sessionSchema.index({ absoluteExpiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Session", sessionSchema);

