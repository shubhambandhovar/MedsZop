const mongoose = require("mongoose");

const pharmacistApplicationSchema = new mongoose.Schema({
    // Owner Details
    owner_name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },

    // Pharmacy Details
    pharmacy_name: { type: String, required: true },
    license_number: { type: String, required: true },
    address: { type: String, required: true },

    // Documents
    pharmacy_license: { type: String, required: true },
    gst_certificate: { type: String }, // Optional

    // Status
    status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING"
    },

    admin_remarks: { type: String },
    rejection_reason: { type: String },

    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("PharmacistApplication", pharmacistApplicationSchema);
