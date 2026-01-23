const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const {
  registerPharmacy,
  getDashboard
} = require("../controllers/pharmacyController");

// Pharmacy Account Only

router.post("/register", auth, role(["pharmacy"]), registerPharmacy);

router.get("/dashboard", auth, role(["pharmacy","admin"]), getDashboard);

module.exports = router;
