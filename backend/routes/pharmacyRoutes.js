const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const Pharmacy = require("../models/Pharmacy");
const Order = require("../models/Order");
const {
  registerPharmacy,
  getDashboard,
  getPharmacyOrders
} = require("../controllers/pharmacyController");

router.get("/orders", auth, role(["pharmacy"]), getPharmacyOrders);

router.post("/register", auth, role(["pharmacy"]), registerPharmacy);

router.get("/dashboard", auth, role(["pharmacy","admin"]), getDashboard);

module.exports = router;
