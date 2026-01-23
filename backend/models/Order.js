const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

  user_id: String,

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

  delivery_agent_id: String,

  status_history: Array,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Order", orderSchema);
