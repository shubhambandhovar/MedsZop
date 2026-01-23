const express = require("express");
const router = express.Router();

const { doctorChat } = require("../controllers/aiController");
const { scanPrescription } = require("../controllers/prescriptionController");

const auth = require("../middleware/authMiddleware");

router.post("/doctor-chat", (req, res) => {
	res.json({ message: "Doctor chat placeholder" });
});

router.post("/scan-prescription", scanPrescription);

module.exports = router;
