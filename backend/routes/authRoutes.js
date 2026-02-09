const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const { register, login, getMe, changePassword, updateProfile, googleLogin, googleSignup } = require("../controllers/authController");

// Customer register
router.post("/register", register);

// Login (all roles)
router.post("/login", login);

// Google OAuth
router.post("/google/login", googleLogin);
router.post("/google/signup", googleSignup);

// Get logged-in user
router.get("/me", auth, getMe);

// Update Profile (Generic)
router.put("/profile", auth, updateProfile);

// Change Password
router.post("/change-password", auth, changePassword);

module.exports = router;
