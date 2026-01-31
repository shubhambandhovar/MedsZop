const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// ✅ IMPORT CONTROLLERS PROPERLY
const {
  createUser,
  getUsers,
  getPharmacies,
  verifyPharmacy,
  stats
} = require("../controllers/adminController");

// ================= ADMIN ROUTES =================

// Dashboard stats
router.get("/stats", auth, role(["admin"]), stats);

// Create pharmacy / delivery user
router.post("/create-user", auth, role(["admin"]), createUser);

// Get all users
router.get("/users", auth, role(["admin"]), getUsers);

// Get all pharmacies
router.get("/pharmacies", auth, role(["admin"]), getPharmacies);

// Verify pharmacy
router.put("/pharmacies/:id/verify", auth, role(["admin"]), verifyPharmacy);

module.exports = router;
