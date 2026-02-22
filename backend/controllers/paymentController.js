const crypto = require("crypto");
const Razorpay = require("razorpay");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Refund = require("../models/Refund");
const mongoose = require("mongoose");
const { sendOrderConfirmedEmail, sendPharmacyOrderNotification, sendOrderPlacedEmail } = require("../utils/emailService");
const User = require("../models/User");
const Pharmacy = require("../models/Pharmacy");

// Ensure keys are present or provide fallback logic to prevent crash during init
// Provide a safe fallback for missing env vars during test
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_fallback",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret_fallback"
});

// CREATE PAYMENT ORDER
exports.createPaymentOrder = async (req, res) => {
  try {
    const { order_id } = req.body;

    // Validate request payload
    if (!order_id) {
      return res.status(400).json({ error: "order_id is required in request payload" });
    }

    // Safety check for malformed IDs that crash mongoose
    if (!mongoose.Types.ObjectId.isValid(order_id)) {
      return res.status(400).json({ error: "Invalid order_id format" });
    }

    // Validate environment variables so it doesn't try linking phantom keys
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === "rzp_test_fallback") {
      console.error("Missing valid RAZORPAY_KEY_ID in environment");
      return res.status(500).json({ error: "Payment gateway is not currently configured" });
    }

    if (!process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET === "rzp_test_secret_fallback") {
      console.error("Missing valid RAZORPAY_KEY_SECRET in environment");
      return res.status(500).json({ error: "Payment gateway is not currently configured" });
    }

    const order = await Order.findById(order_id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Ensure total is a valid number to prevent Razorpay crashes
    if (typeof order.total !== 'number' || isNaN(order.total) || order.total <= 0) {
      return res.status(400).json({ error: "Invalid order total amount for payment" });
    }

    // Important: Amount is calculated on backend (Order total in INR)
    const amountInPaise = Math.round(order.total * 100);

    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: order._id.toString()
    });

    order.pg_order_id = rzpOrder.id;
    await order.save(); // Save pg order id

    res.status(200).json({
      amount: rzpOrder.amount,
      pg_order_id: rzpOrder.id,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error("Create Payment Order Error:", err?.message || err);
    res.status(500).json({ error: "Failed to create payment order. Please try again later." });
  }
};

// VERIFY PAYMENT (Frontend callback)
exports.verifyPayment = async (req, res) => {
  try {
    const { order_id, pg_order_id, pg_payment_id, signature } = req.body;

    const body = pg_order_id + "|" + pg_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret_fallback")
      .update(body.toString())
      .digest("hex");

    let isAuthentic = expectedSignature === signature;
    if (!isAuthentic) {
      // Create a failed payment record
      await Payment.create({
        order_id,
        pg_order_id,
        pg_payment_id,
        amount: 0, // Not verified
        status: "FAILED",
        error_description: "Invalid Signature"
      });
      return res.status(400).json({ message: "Invalid Signature. Payment verification failed." });
    }

    const order = await Order.findById(order_id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.payment_status === "paid") {
      return res.status(200).json({ message: "Already Paid", verified: true });
    }

    // Update order status
    const verifiedStatus = order.prescription_url ? "pending_verification" : "pending";
    order.payment_status = "paid";
    order.order_status = verifiedStatus;
    order.pg_payment_id = pg_payment_id;
    order.status_history.push({ status: verifiedStatus, timestamp: new Date() });

    // Store payment
    await Payment.create({
      order_id,
      pg_order_id,
      pg_payment_id,
      amount: order.total,
      status: "SUCCESS",
      method: "ONLINE"
    });

    // Notify Pharmacy and Customer about successful payment placement
    try {
      // 1. Send Placed Email to Customer (Deferred until payment success)
      if (!order.emailSent?.placed) {
        const user = await User.findById(order.user_id);
        if (user && user.email) {
          await sendOrderPlacedEmail(user.email, user.name, order.orderNumber);
          
          order.emailSent = order.emailSent || {};
          order.emailSent.placed = true;
        }
      }

      // 2. Notify Pharmacy
      if (order.pharmacy_id && !order.emailSent?.pharmacyNotified) {
        const pharmacy = await Pharmacy.findById(order.pharmacy_id);
        if (pharmacy) {
          const pharmacyUser = await User.findById(pharmacy.user_id);
          if (pharmacyUser && pharmacyUser.email) {
            await sendPharmacyOrderNotification(pharmacyUser.email, pharmacy.name || pharmacyUser.name, order.orderNumber);
            order.emailSent.pharmacyNotified = true;
          }
        }
      }
    } catch (err) {
      console.error("Email error after payment verification", err);
    }

    await order.save();

    res.json({ verified: true, message: "Payment successful" });
  } catch (err) {
    console.error("Verify Payment Error:", err);
    res.status(500).json({ error: "Failed to verify payment" });
  }
};

// REFUND PAYMENT (Admin / System Triggered)
exports.refundPayment = async (req, res) => {
  try {
    const { order_id, reason } = req.body;
    const order = await Order.findById(order_id);

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!order.pg_payment_id) return res.status(400).json({ message: "No successful payment found for this order" });

    // Call Gateway
    const refund = await razorpay.payments.refund(order.pg_payment_id, {
      amount: Math.round(order.total * 100), // full refund
      notes: { reason }
    });

    // DB Updates
    order.refund_status = "initiated";
    // Usually partial or fully refunded
    order.payment_status = "refunded";
    await order.save();

    await Refund.create({
      order_id: order._id,
      pg_refund_id: refund.id,
      amount: order.total,
      status: "INITIATED",
      reason
    });

    res.json({ message: "Refund initiated successfully", refund });
  } catch (err) {
    console.error("Refund Error:", err);
    res.status(500).json({ error: err.message || "Failed to process refund" });
  }
};

// WEBHOOK HANDLER
exports.paymentWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "12345678";
    const signature = req.headers["x-razorpay-signature"];

    if (!signature) {
      return res.status(400).send("No signature found");
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Invalid Webhook Signature");
      return res.status(400).send("Invalid signature");
    }

    const { event, payload } = req.body;
    if (event === "payment.failed") {
      const paymentEntity = payload.payment.entity;
      const pg_order_id = paymentEntity.order_id;
      const order = await Order.findOne({ pg_order_id });
      if (order) {
        // Create failed payment log
        await Payment.create({
          order_id: order._id,
          pg_order_id,
          pg_payment_id: paymentEntity.id,
          amount: paymentEntity.amount / 100,
          status: "FAILED",
          error_description: paymentEntity.error_description
        });
      }
    }
    // Handle other events like refund.processed or payment.captured if needed

    res.status(200).send("ok");
  } catch (err) {
    console.error("Webhook Error:", err);
    res.status(500).send("error");
  }
};
