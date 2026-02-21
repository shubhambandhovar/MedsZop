const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema({
  payment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  pg_refund_id: String,
  amount: { type: Number, required: true },
  status: { type: String, default: "INITIATED" }, // INITIATED, COMPLETED, FAILED
  reason: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Refund", refundSchema);
