const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const { register, login, getMe } = require("../controllers/authController");

// ================= AUTH ROUTES =================

// Customer register
router.post("/register", register);

// Login (all roles)
router.post("/login", login);

// Get logged-in user profile
router.get("/me", auth, getMe);

module.exports = router;
