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
  resetPasswordAttempts: {
    type: Number,
    default: 0
  },

  welcomeEmailSent: {
    type: Boolean,
    default: false
  },

  // Account Lifecycle & Security Management
  isActive: {
    type: Boolean,
    default: true
  },
  deactivatedAt: {
    type: Date,
    default: null
  },
  deactivatedBy: {
    type: String,
    default: null
  },
  deactivationReason: {
    type: String,
    default: ""
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: String,
    default: null
  },
  deletionReason: {
    type: String,
    default: ""
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

// Recommended Indexes (Phase 9D & Account Lifecycle)
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isDeleted: 1 });

module.exports = mongoose.model("User", userSchema);
