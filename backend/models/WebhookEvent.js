const mongoose = require("mongoose");

const webhookEventSchema = new mongoose.Schema({
  event_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  event_type: {
    type: String,
    required: true,
    index: true
  },
  account_id: String,
  order_id: String,
  payment_id: String,
  amount: Number,
  currency: {
    type: String,
    default: "INR"
  },
  status: {
    type: String,
    enum: ["processing", "processed", "failed"],
    default: "processing",
    index: true
  },
  error_message: String,
  attempts: {
    type: Number,
    default: 1
  },
  processed_at: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 7 // 7-day TTL auto-cleanup
  }
});

module.exports = mongoose.model("WebhookEvent", webhookEventSchema);

