const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  pg_payment_id: String, // Transaction ID from Gateway
  pg_order_id: String,
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  method: String, // UPI, CARD, NETBANKING
  status: { type: String, default: "INITIALIZED" }, // INITIALIZED, SUCCESS, FAILED, REFUNDED
  error_code: String,
  error_description: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Payment", paymentSchema);
