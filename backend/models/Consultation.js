const mongoose = require("mongoose");

const consultationSchema = new mongoose.Schema({
    patient_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    doctor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    symptoms: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["PENDING", "ACCEPTED", "REJECTED", "COMPLETED"],
        default: "PENDING"
    },
    prescription_url: {
        type: String
    },
    notes: {
        type: String
    },
    messages: [{
        sender: { type: String, enum: ['doctor', 'patient'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Consultation", consultationSchema);
