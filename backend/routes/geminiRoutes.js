const express = require("express");
const router = express.Router();
const { parsePrescriptionWithGemini } = require("../controllers/geminiController");

router.post("/parse-prescription", parsePrescriptionWithGemini);

module.exports = router;
