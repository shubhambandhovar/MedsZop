const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  createPaymentOrder,
  verifyPayment,
  paymentWebhook,
  refundPayment
} = require("../controllers/paymentController");

// Create Razorpay Order
router.post("/create-order", auth, createPaymentOrder);

// Verify Payment
router.post("/verify", auth, verifyPayment);

// Webhook for edge cases and refunds
router.post("/webhook", express.json(), paymentWebhook);

// Refund logic (Internal/Admin)
router.post("/refund", auth, refundPayment);

module.exports = router;
