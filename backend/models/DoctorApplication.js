const mongoose = require("mongoose");

const doctorApplicationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true }, // Verified unique in controller
    phone: { type: String, required: true },

    // Professional Details
    registration_number: { type: String, required: true },
    qualification: { type: String, required: true },
    specialization: { type: String, required: true },
    experience_years: { type: Number, required: true },
    consultation_type: {
        type: String,
        enum: ["Chat", "Video", "Both"],
        required: true
    },

    // Documents (URLs)
    degree_certificate: { type: String, required: true },
    medical_registration_proof: { type: String, required: true },

    // Status
    status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING"
    },

    // Admin Feedback
    admin_remarks: { type: String },
    rejection_reason: { type: String },

    // Link to created user (populated after approval)
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("DoctorApplication", doctorApplicationSchema);
