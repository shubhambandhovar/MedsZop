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
    default: "cod"
  },

  payment_status: {
    type: String,
    default: "pending"
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

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Order", orderSchema);
