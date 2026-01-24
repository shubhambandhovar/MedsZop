const express = require("express");
const router = express.Router();

const { doctorChat } = require("../controllers/aiController");
const { scanPrescription } = require("../controllers/prescriptionController");

const auth = require("../middleware/authMiddleware");

// ✅ Doctor Chat API
router.post("/doctor-chat", auth, doctorChat);

// ✅ Prescription Scan API
router.post("/scan-prescription", auth, scanPrescription);

module.exports = router;
