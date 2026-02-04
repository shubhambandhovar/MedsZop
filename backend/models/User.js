const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  name: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["customer", "pharmacy", "delivery", "admin"],
    default: "customer"
  },

  addresses: [
    {
      name: String,
      mobile: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      pincode: String,
      landmark: String,
      addressType: { type: String, enum: ["Home", "Work", "Other"], default: "Home" },
      coordinates: {
        lat: Number,
        lon: Number
      }
    }
  ],

  cart: [
    {
      medicine_id: String,
      quantity: {
        type: Number,
        default: 1
      }
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);
