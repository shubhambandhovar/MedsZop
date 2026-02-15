const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const {
    getVerifiedDoctors,
    requestConsultation,
    getDoctorConsultations,
    updateConsultationStatus
} = require("../controllers/doctorController");

// Public (or Customer protected)
router.get("/list", getVerifiedDoctors);
router.post("/consult", auth, requestConsultation);

// Doctor Protected
router.get("/appointments", auth, role(["doctor"]), getDoctorConsultations);
router.put("/appointments/:id", auth, role(["doctor"]), updateConsultationStatus);

module.exports = router;
