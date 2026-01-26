const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const {
  stats,
  createUser,
  getUsers,
  getPharmacies,
  verifyPharmacy
} = require("../controllers/adminController");

// Admin only routes

router.get("/stats", auth, role(["admin"]), stats);

router.post("/create-user", auth, role(["admin"]), createUser);

router.get("/users", auth, role(["admin"]), getUsers);

router.get("/pharmacies", auth, role(["admin"]), getPharmacies);

router.put("/pharmacies/:id/verify", auth, role(["admin"]), verifyPharmacy);

module.exports = router;
