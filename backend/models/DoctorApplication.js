const mongoose = require("mongoose");

const doctorApplicationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },

    // Professional Details
    registration_number: { type: String, required: true, uppercase: true, trim: true },
    qualification: { type: String, required: true },
    specialization: { type: String, required: true },
    experience_years: { type: Number, required: true },
    consultation_type: {
        type: String,
        enum: ["Chat", "Video", "Both", "Chat & Video", "Chat Only", "Audio & Video"],
        default: "Both"
    },

    // Documents (Encrypted or Private Object Storage Keys)
    degree_certificate: { type: String },
    medical_registration_proof: { type: String, required: true },

    // Security & Ownership
    access_key_hash: { type: String }, // SHA-256 hash of client ownership secret
    activation_token: { type: String }, // Single-use account activation link
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

    // Link to created user (populated after approval)
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("DoctorApplication", doctorApplicationSchema);
