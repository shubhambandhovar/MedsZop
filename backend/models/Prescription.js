const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  file_url: { type: String, required: true },
  filename: { type: String, required: true },
  original_name: { type: String },
  mime_type: { type: String },
  file_size: { type: Number },
  raw_text: { type: String },
  parsed_data: { type: Object },
  order_id: { type: String },
  pharmacy_id: { type: String, default: null },
  assigned_pharmacist_id: { type: String, default: null },
  verification_notes: { type: String, default: "" },
  status: {
    type: String,
    enum: ["uploaded", "needs_review", "verified", "rejected", "clarification_requested"],
    default: "uploaded"
  },
  createdAt: { type: Date, default: Date.now }
});

// Recommended Indexes (Phase 9D)
prescriptionSchema.index({ user_id: 1, createdAt: -1 });
prescriptionSchema.index({ filename: 1 });
prescriptionSchema.index({ file_url: 1 });
prescriptionSchema.index({ order_id: 1 });
prescriptionSchema.index({ pharmacy_id: 1, createdAt: -1 });

module.exports = mongoose.model("Prescription", prescriptionSchema);

