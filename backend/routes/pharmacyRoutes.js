const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const {
  registerPharmacy,
  getDashboard,
  getPharmacyOrders,
  addMedicine
} = require("../controllers/pharmacyController");

// Register pharmacy
router.post("/register", auth, role(["pharmacy"]), registerPharmacy);

// Pharmacy dashboard
router.get("/dashboard", auth, role(["pharmacy","admin"]), getDashboard);

// ✅ THIS IS REQUIRED
router.get("/orders", auth, role(["pharmacy"]), getPharmacyOrders);

router.post("/add-medicine", auth, role(["pharmacy"]), addMedicine);

module.exports = router;
