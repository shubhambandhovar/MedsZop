const mongoose = require("mongoose");

const deliveryApplicationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },

    vehicle_type: { type: String, required: true },

    // Documents
    driving_license: { type: String, required: true },
    id_proof: { type: String, required: true },

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

module.exports = mongoose.model("DeliveryApplication", deliveryApplicationSchema);
