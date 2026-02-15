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
    required: false
  },

  name: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: false
  },

  role: {
    type: String,
    enum: ["customer", "pharmacy", "delivery", "admin", "doctor"],
    default: "customer"
  },

  is_first_login: {
    type: Boolean,
    default: false
  },

  googleId: {
    type: String,
    default: null
  },

  authProvider: {
    type: String,
    enum: ["local", "google"],
    default: "local"
  },

  resetPasswordOtp: String,
  resetPasswordExpire: Date,

  welcomeEmailSent: {
    type: Boolean,
    default: false
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
