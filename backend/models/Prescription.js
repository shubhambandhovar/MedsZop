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
  status: {
    type: String,
    enum: ["uploaded", "verified", "rejected"],
    default: "uploaded"
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Prescription", prescriptionSchema);

