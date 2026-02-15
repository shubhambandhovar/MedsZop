const User = require("../models/User");
const Consultation = require("../models/Consultation");
const DoctorApplication = require("../models/DoctorApplication");

/**
 * GET ALL VERIFIED DOCTORS
 */
exports.getVerifiedDoctors = async (req, res) => {
    try {
        const doctors = await User.find({ role: "doctor" }).select("name email phone _id");

        // Enrich with specialization/exp from Application (optional, but good for UI)
        // This requires a lookup or storing it in User. For now, simplifed.

        /* 
           Optimally, we should have stored profile details in User or a DoctorProfile.
           Since we didn't refactor User heavily, let's fetch Application details matching the user's email 
           to get specialization.
        */

        const enrichedDoctors = await Promise.all(doctors.map(async (doc) => {
            const app = await DoctorApplication.findOne({ email: doc.email, status: "APPROVED" });
            return {
                ...doc.toObject(),
                specialization: app?.specialization || "General Physician",
                experience_years: app?.experience_years || 0,
                qualification: app?.qualification || "MBBS"
            };
        }));

        res.json(enrichedDoctors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * REQUEST CONSULTATION
 */
exports.requestConsultation = async (req, res) => {
    try {
        const { doctor_id, symptoms } = req.body;

        const consultation = await Consultation.create({
            patient_id: req.user.id,
            doctor_id,
            symptoms
        });

        res.status(201).json(consultation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET DOCTOR'S CONSULTATIONS
 */
exports.getDoctorConsultations = async (req, res) => {
    try {
        const consultations = await Consultation.find({ doctor_id: req.user.id })
            .populate("patient_id", "name email phone")
            .sort({ createdAt: -1 });

        res.json(consultations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * UPDATE CONSULTATION STATUS (Accept/Reject/Complete)
 */
exports.updateConsultationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, prescription_url, notes } = req.body;

        const consultation = await Consultation.findById(id);
        if (!consultation) return res.status(404).json({ message: "Consultation not found" });

        // Verify authorized doctor
        if (consultation.doctor_id.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        if (status) consultation.status = status;
        if (prescription_url) consultation.prescription_url = prescription_url;
        if (notes) consultation.notes = notes;

        await consultation.save();
        res.json(consultation);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET PATIENT'S CONSULTATIONS
 */
exports.getPatientConsultations = async (req, res) => {
    try {
        const consultations = await Consultation.find({ patient_id: req.user.id })
            .populate("doctor_id", "name email phone")
            .sort({ createdAt: -1 });

        res.json(consultations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * SEND MESSAGE
 */
exports.sendMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        const consultation = await Consultation.findById(id);
        if (!consultation) return res.status(404).json({ message: "Consultation not found" });

        // Determine sender
        let sender = "";
        if (consultation.doctor_id.toString() === req.user.id) {
            sender = "doctor";
        } else if (consultation.patient_id.toString() === req.user.id) {
            sender = "patient";
        } else {
            return res.status(403).json({ message: "Unauthorized access to this consultation" });
        }

        consultation.messages.push({
            sender,
            content: message
        });

        await consultation.save();
        res.json(consultation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET CONSULTATION DETAILS (For Chat)
 */
exports.getConsultation = async (req, res) => {
    try {
        const { id } = req.params;
        const consultation = await Consultation.findById(id)
            .populate("doctor_id", "name")
            .populate("patient_id", "name");

        if (!consultation) return res.status(404).json({ message: "Consultation not found" });

        // Verify access
        if (consultation.doctor_id._id.toString() !== req.user.id && consultation.patient_id._id.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        res.json(consultation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
