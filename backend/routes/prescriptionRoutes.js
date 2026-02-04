const express = require("express");
const router = express.Router();
const { scanPrescription } = require("../controllers/prescriptionController");
const auth = require("../middleware/authMiddleware");

// Get user prescriptions (placeholder to avoid 404)
router.get("/", auth, (req, res) => res.json([]));

router.post("/scan", scanPrescription);

module.exports = router;
