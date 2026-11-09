const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const { createRateLimiter } = require("../utils/rateLimiter");

const {
  createPaymentOrder,
  verifyPayment,
  paymentWebhook,
  refundPayment
} = require("../controllers/paymentController");

// Rate limiter for verification callback (Phase 9D)
const verifyLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many payment verification attempts. Please wait a few moments."
});

// Create Razorpay Order
router.post("/create-order", auth, createPaymentOrder);

// Verify Payment
router.post("/verify", auth, verifyLimiter, verifyPayment);

// Webhook for edge cases, automated capture, and refunds (SEC-08)
router.post("/webhook", paymentWebhook);

// Refund logic (SEC-02 Remediation: Strictly Admin Only)
router.post("/refund", auth, role(["admin"]), refundPayment);

module.exports = router;
