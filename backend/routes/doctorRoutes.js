const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const {
    getVerifiedDoctors,
    requestConsultation,
    getDoctorConsultations,
    updateConsultationStatus,
    getPatientConsultations,
    sendMessage,
    getConsultation
} = require("../controllers/doctorController");

// Public (or Customer protected)
router.get("/list", getVerifiedDoctors);
router.post("/consult", auth, requestConsultation);
router.get("/my-consultations", auth, getPatientConsultations); // For patients

// Chat Routes (Shared access)
router.get("/consultation/:id", auth, getConsultation);
router.post("/consultation/:id/chat", auth, sendMessage);

// Doctor Protected
router.get("/appointments", auth, role(["doctor"]), getDoctorConsultations);
router.put("/appointments/:id", auth, role(["doctor"]), updateConsultationStatus);

module.exports = router;
