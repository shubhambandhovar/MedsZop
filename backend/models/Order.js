const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

  user_id: String,
  orderNumber: { type: String, unique: true },
  pharmacy_id: String,

  items: [
    {
      medicine_id: String,
      name: String,
      price: Number,
      quantity: Number
    }
  ],

  address: Object,

  total: Number,


  prescription_id: String,
  prescription_url: String, // URL/Path to uploaded prescription
  requires_prescription: { type: Boolean, default: false },

  payment_method: {
    type: String,
    default: "cod" // 'cod', 'online'
  },

  payment_status: {
    type: String,
    default: "pending" // 'pending', 'paid', 'failed', 'refunded'
  },

  pg_order_id: String,
  pg_payment_id: String,
  
  refund_status: {
    type: String,
    default: "none" // 'none', 'initiated', 'completed', 'failed'
  },

  order_status: {
    type: String,
    default: "pending"
  },

  emailSent: {
    placed: { type: Boolean, default: false },
    confirmed: { type: Boolean, default: false },
    cancelled: { type: Boolean, default: false },
    outForDelivery: { type: Boolean, default: false },
    delivered: { type: Boolean, default: false },
    pharmacyNotified: { type: Boolean, default: false },
    deliveryNotified: { type: Boolean, default: false }
  },

  delivery_agent_id: String,

  delivery_otp: String,

  status_history: Array,

  // Cancellation Fields
  cancelledBy: String,
  cancelledAt: Date,
  cancelReason: String,

  // Return Fields
  returnReason: String,
  returnComments: String,
  returnImages: [String],
  returnRequestedAt: Date,

  // Logistics & Financial Separation Fields
  handover_verified: { type: Boolean, default: false },
  delivered_at: Date,
  cod_collected: { type: Boolean, default: false },
  cod_collected_amount: { type: Number, default: 0 },
  cod_collected_at: Date,
  cod_reconciled: { type: Boolean, default: false },
  cod_reconciled_at: Date,
  cod_reconciled_by: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

// Recommended Compound and Single-Field Indexes (Phase 9D)
orderSchema.index({ user_id: 1, createdAt: -1 });
orderSchema.index({ pharmacy_id: 1, order_status: 1 });
orderSchema.index({ delivery_agent_id: 1, order_status: 1 });
orderSchema.index({ pg_order_id: 1 });
orderSchema.index({ order_status: 1 });
orderSchema.index({ payment_status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
