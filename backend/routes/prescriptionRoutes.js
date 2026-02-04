const express = require("express");
const router = express.Router();
const { scanPrescription } = require("../controllers/prescriptionController");

router.post("/scan", scanPrescription);

module.exports = router;
