const express = require("express");
const router = express.Router();
const { scanPrescription } = require("../controllers/prescriptionController");
const verifyToken = require("../middleware/authMiddleware");

router.post("/scan", scanPrescription);
// router.get("/", verifyToken, getAllPrescriptions);

module.exports = router;
