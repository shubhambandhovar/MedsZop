const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const { createRateLimiter } = require("../utils/rateLimiter");
const { register, login, getMe, changePassword, updateProfile, googleLogin, googleSignup, forgotPassword, verifyResetOTP, resetPassword } = require("../controllers/authController");
const { sendOTP, verifyOTP } = require("../controllers/otpController");

// Rate limiters for sensitive authentication endpoints (Phase 9D Hardening)
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 15,
  message: "Too many login attempts. Please try again after 15 minutes."
});

const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: "Too many account registrations from this IP. Please try again later."
});

const passwordResetLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 10,
  message: "Too many password recovery attempts. Please try again after 15 minutes."
});

// OTP routes
router.post("/send-otp", passwordResetLimiter, sendOTP);
router.post("/verify-otp", passwordResetLimiter, verifyOTP);

// Customer register
router.post("/register", registerLimiter, register);

// Login (all roles)
router.post("/login", loginLimiter, login);

// Google OAuth
router.post("/google/login", loginLimiter, googleLogin);
router.post("/google/signup", registerLimiter, googleSignup);

// Get logged-in user
router.get("/me", auth, getMe);

// Update Profile (Generic)
router.put("/profile", auth, updateProfile);

// Change Password (Authenticated)
router.post("/change-password", auth, changePassword);

// Forgot Password Flow
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/verify-reset-otp", passwordResetLimiter, verifyResetOTP);
router.post("/reset-password", passwordResetLimiter, resetPassword);

module.exports = router;
