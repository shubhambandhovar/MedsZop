const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const { register, login, getMe } = require("../controllers/authController");

// Customer register
router.post("/register", register);

// Login (all roles)
router.post("/login", login);

// Get logged-in user
router.get("/me", auth, getMe);

module.exports = router;
