const mongoose = require("mongoose");

const pharmacistApplicationSchema = new mongoose.Schema({
    // Owner Details
    owner_name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },

    // Pharmacy Details
    pharmacy_name: { type: String, required: true },
    license_number: { type: String, required: true, uppercase: true, trim: true },
    address: { type: String, required: true },

    // Documents
    pharmacy_license: { type: String, required: true },
    gst_certificate: { type: String },

    // Security & Ownership
    access_key_hash: { type: String },
    activation_token: { type: String },
    activation_expires: { type: Date },

    // Status Lifecycle
    status: {
        type: String,
        enum: ["DRAFT", "PENDING", "UNDER_REVIEW", "ADDITIONAL_INFO_REQUIRED", "APPROVED", "REJECTED"],
        default: "PENDING"
    },

    // Admin Feedback & Audit
    admin_remarks: { type: String },
    rejection_reason: { type: String },
    reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewed_at: { type: Date },

    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("PharmacistApplication", pharmacistApplicationSchema);
