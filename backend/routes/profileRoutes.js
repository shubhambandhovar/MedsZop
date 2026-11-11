const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { createRateLimiter } = require("../utils/rateLimiter");
const {
  getProfile,
  updateProfile,
  requestEmailChange,
  verifyEmailChange,
  listSessions,
  revokeSession,
  revokeOtherSessions,
} = require("../controllers/profileController");

const emailChangeLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many email change requests. Please try again after 15 minutes.",
});

// All profile endpoints require valid authenticated session
router.use(auth);

// Profile Get & Update
router.get("/", getProfile);
router.put("/", updateProfile);

// Secure Email Verification Flow
router.post("/request-email-change", emailChangeLimiter, requestEmailChange);
router.post("/verify-email-change", emailChangeLimiter, verifyEmailChange);

// Active Devices & Session Management
router.get("/sessions", listSessions);
router.post("/sessions/:sessionId/revoke", revokeSession);
router.post("/sessions/revoke-others", revokeOtherSessions);

module.exports = router;

