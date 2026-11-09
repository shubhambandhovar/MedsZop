const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

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

// Webhook for edge cases, automated capture, and refunds (SEC-08)
router.post("/webhook", paymentWebhook);

// Refund logic (SEC-02 Remediation: Strictly Admin Only)
router.post("/refund", auth, role(["admin"]), refundPayment);

module.exports = router;
