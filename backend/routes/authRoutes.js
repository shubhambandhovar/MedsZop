const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const { register, login, getMe, changePassword } = require("../controllers/authController");

// Customer register
router.post("/register", register);

// Login (all roles)
router.post("/login", login);

// Get logged-in user
router.get("/me", auth, getMe);

// Change Password
router.post("/change-password", auth, changePassword);

module.exports = router;
