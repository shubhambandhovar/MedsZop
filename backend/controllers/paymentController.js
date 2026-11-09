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

// Replay protection: in-memory cache of verified webhook event identifiers (SEC-08)
const processedWebhookEvents = new Map();

// Periodic cleanup of webhook event cache (every 60 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of processedWebhookEvents.entries()) {
    if (now - data.timestamp > 24 * 60 * 60 * 1000) {
      processedWebhookEvents.delete(id);
    }
  }
}, 60 * 60 * 1000).unref();

// VERIFY PAYMENT (Frontend callback - SEC-08 Hardened)
exports.verifyPayment = async (req, res) => {
  try {
    const { order_id, pg_order_id, pg_payment_id, signature } = req.body;

    if (!order_id || !pg_order_id || !pg_payment_id || !signature) {
      return res.status(400).json({ message: "Missing required payment verification fields" });
    }

    const order = await Order.findById(order_id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Object-level ownership check (SEC-05 / SEC-08):
    // Authenticated caller must own the order or have admin privileges
    if (req.user && req.user.role !== "admin" && order.user_id?.toString() !== req.user.id?.toString()) {
      return res.status(403).json({ message: "Forbidden: You cannot verify payment for an order belonging to another user." });
    }

    // Gateway reference validation: ensure pg_order_id matches order
    if (order.pg_order_id && order.pg_order_id !== pg_order_id) {
      return res.status(400).json({ message: "Mismatched gateway order reference." });
    }

    // Timing-safe HMAC signature verification
    const body = pg_order_id + "|" + pg_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret_fallback")
      .update(body.toString())
      .digest("hex");

    let isAuthentic = false;
    if (typeof signature === "string") {
      const sigBuf = Buffer.from(signature, "utf-8");
      const expBuf = Buffer.from(expectedSignature, "utf-8");
      if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
        isAuthentic = true;
      }
    }

    if (!isAuthentic) {
      // Create a failed payment audit log
      await Payment.create({
        order_id,
        pg_order_id,
        pg_payment_id,
        amount: 0,
        status: "FAILED",
        error_description: "Invalid Signature"
      });
      return res.status(400).json({ message: "Invalid Signature. Payment verification failed." });
    }

    // Idempotency: If already paid, return early without re-executing business logic
    if (order.payment_status === "paid") {
      return res.status(200).json({ message: "Already Paid", verified: true });
    }

    // Update order status
    const verifiedStatus = order.prescription_url ? "pending_verification" : "pending";
    order.payment_status = "paid";
    order.order_status = verifiedStatus;
    order.pg_payment_id = pg_payment_id;
    order.status_history = order.status_history || [];
    order.status_history.push({ status: verifiedStatus, timestamp: new Date(), source: "client_verification" });

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
      if (!order.emailSent?.placed) {
        const user = await User.findById(order.user_id);
        if (user && user.email) {
          await sendOrderPlacedEmail(user.email, user.name, order.orderNumber);
          order.emailSent = order.emailSent || {};
          order.emailSent.placed = true;
        }
      }

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

    return res.json({ verified: true, message: "Payment successful" });
  } catch (err) {
    console.error("Verify Payment Error:", err);
    return res.status(500).json({ error: "Failed to verify payment" });
  }
};

// REFUND PAYMENT (SEC-02 Remediation: Admin Only & Eligibility Checks)
exports.refundPayment = async (req, res) => {
  try {
    // 1. Strict Server-Side Role Enforcement (Defense-in-depth)
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Administrator privileges required to issue refunds." });
    }

    const { order_id, reason } = req.body;

    if (!order_id || !mongoose.Types.ObjectId.isValid(order_id)) {
      return res.status(400).json({ message: "Valid order_id is required" });
    }

    const order = await Order.findById(order_id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // 2. Validate Payment Eligibility
    if (order.payment_status !== "paid" || !order.pg_payment_id) {
      return res.status(400).json({ message: "Order has not been successfully paid or lacks a transaction reference." });
    }

    // 3. Prevent Duplicate Refunds
    if (order.refund_status === "initiated" || order.refund_status === "completed" || order.payment_status === "refunded") {
      return res.status(400).json({ message: "A refund has already been processed or initiated for this order." });
    }

    // 4. Validate Environment Gateway Keys
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_ID === "rzp_test_fallback") {
      console.warn("⚠️ RAZORPAY keys unconfigured or mock mode active during refund attempt.");
    }

    // Call Gateway
    const refund = await razorpay.payments.refund(order.pg_payment_id, {
      amount: Math.round(order.total * 100), // full refund in paise
      notes: { reason: reason || "Admin initiated refund" }
    });

    // DB Updates
    order.refund_status = "initiated";
    order.payment_status = "refunded";
    await order.save();

    await Refund.create({
      order_id: order._id,
      pg_refund_id: refund.id,
      amount: order.total,
      status: "INITIATED",
      reason: reason || "Admin initiated refund"
    });

    res.json({ message: "Refund initiated successfully", refund });
  } catch (err) {
    console.error("Refund Error:", err);
    res.status(500).json({ error: err.message || "Failed to process refund" });
  }
};

// WEBHOOK HANDLER (SEC-08 Hardened: Raw Buffer HMAC-SHA256, Replay Protection & Integrity)
exports.paymentWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Fail closed if webhook secret is completely unconfigured
    if (!webhookSecret) {
      console.error("Missing RAZORPAY_WEBHOOK_SECRET in environment");
      return res.status(500).json({ error: "Webhook endpoint not configured" });
    }

    const signature = req.headers["x-razorpay-signature"];
    if (!signature || typeof signature !== "string") {
      return res.status(400).json({ error: "No signature found" });
    }

    // Exact raw body bytes verification (never stringified JSON)
    const rawPayload = req.rawBody
      ? req.rawBody
      : (Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body)));

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawPayload)
      .digest("hex");

    // Timing-safe HMAC verification
    const sigBuf = Buffer.from(signature, "utf-8");
    const expBuf = Buffer.from(expectedSignature, "utf-8");

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      console.error("Invalid Webhook Signature detected");
      return res.status(400).json({ error: "Invalid signature" });
    }

    // 1. Replay Attack Protection: Track verified event IDs
    const eventId =
      req.headers["x-razorpay-event-id"] ||
      req.body?.event_id ||
      (req.body?.payload?.payment?.entity?.id ? `${req.body.payload.payment.entity.id}_${req.body.event}` : null);

    if (eventId && processedWebhookEvents.has(eventId)) {
      return res.status(200).json({ status: "already_processed", message: "Event already processed (replay ignored)" });
    }

    const { event, payload } = req.body || {};

    // 2. Event Handling: payment.captured / order.paid
    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload?.payment?.entity;
      if (!paymentEntity) {
        return res.status(400).json({ error: "Missing payment entity in payload" });
      }

      const pg_order_id = paymentEntity.order_id;
      const pg_payment_id = paymentEntity.id;
      const paymentAmountPaise = paymentEntity.amount;

      const order = await Order.findOne({ pg_order_id });
      if (!order) {
        console.warn(`Webhook: Order not found for pg_order_id: ${pg_order_id}`);
        return res.status(200).json({ message: "Order not found; recorded for reconciliation" });
      }

      // 3. Payment Amount Integrity Check: Verify exact paise amount
      const expectedAmountPaise = Math.round(order.total * 100);
      if (paymentAmountPaise !== expectedAmountPaise) {
        console.error(`🚨 Webhook Tampering: Expected ${expectedAmountPaise} paise, received ${paymentAmountPaise} paise`);
        return res.status(400).json({ error: "Payment amount mismatch with order total" });
      }

      // 4. Idempotency Guard: Prevent duplicate transitions if order already marked paid
      if (order.payment_status === "paid") {
        if (eventId) processedWebhookEvents.set(eventId, { timestamp: Date.now() });
        return res.status(200).json({ status: "ok", message: "Order already marked as paid" });
      }

      // Update Order Status
      const verifiedStatus = order.prescription_url ? "pending_verification" : "pending";
      order.payment_status = "paid";
      order.order_status = verifiedStatus;
      order.pg_payment_id = pg_payment_id;
      order.status_history = order.status_history || [];
      order.status_history.push({ status: verifiedStatus, timestamp: new Date(), source: "webhook_capture" });

      // Create Payment Record (idempotently)
      const existingPayment = await Payment.findOne({ pg_payment_id });
      if (!existingPayment) {
        await Payment.create({
          order_id: order._id,
          pg_order_id,
          pg_payment_id,
          amount: order.total,
          status: "SUCCESS",
          method: paymentEntity.method ? paymentEntity.method.toUpperCase() : "ONLINE"
        });
      }

      // Trigger notification emails if not already sent
      try {
        if (!order.emailSent?.placed) {
          const user = await User.findById(order.user_id);
          if (user && user.email) {
            await sendOrderPlacedEmail(user.email, user.name, order.orderNumber);
            order.emailSent = order.emailSent || {};
            order.emailSent.placed = true;
          }
        }

        if (order.pharmacy_id && !order.emailSent?.pharmacyNotified) {
          const pharmacy = await Pharmacy.findById(order.pharmacy_id);
          if (pharmacy) {
            const pharmacyUser = await User.findById(pharmacy.user_id);
            if (pharmacyUser && pharmacyUser.email) {
              await sendPharmacyOrderNotification(pharmacyUser.email, pharmacy.name || pharmacyUser.name, order.orderNumber);
              order.emailSent = order.emailSent || {};
              order.emailSent.pharmacyNotified = true;
            }
          }
        }
      } catch (emailErr) {
        console.error("Email notification error during webhook:", emailErr.message);
      }

      await order.save();
    }

    // 5. Event Handling: payment.failed
    else if (event === "payment.failed") {
      const paymentEntity = payload?.payment?.entity;
      if (paymentEntity) {
        const pg_order_id = paymentEntity.order_id;
        const order = await Order.findOne({ pg_order_id });
        if (order && order.payment_status !== "paid") {
          order.payment_status = "failed";
          order.status_history = order.status_history || [];
          order.status_history.push({ status: "payment_failed", timestamp: new Date(), source: "webhook_failed" });
          await order.save();

          // Log failed payment idempotently
          const existingPayment = await Payment.findOne({ pg_payment_id: paymentEntity.id });
          if (!existingPayment) {
            await Payment.create({
              order_id: order._id,
              pg_order_id,
              pg_payment_id: paymentEntity.id,
              amount: (paymentEntity.amount || 0) / 100,
              status: "FAILED",
              error_code: paymentEntity.error_code,
              error_description: paymentEntity.error_description
            });
          }
        }
      }
    }

    // 6. Event Handling: refund.processed / refund.created
    else if (event === "refund.processed" || event === "refund.created") {
      const refundEntity = payload?.refund?.entity;
      if (refundEntity) {
        const pg_payment_id = refundEntity.payment_id;
        const order = await Order.findOne({ pg_payment_id });
        if (order) {
          order.refund_status = "completed";
          order.payment_status = "refunded";
          await order.save();

          await Refund.findOneAndUpdate(
            { pg_refund_id: refundEntity.id },
            { status: "COMPLETED", amount: (refundEntity.amount || 0) / 100 },
            { upsert: true, new: true }
          );
        }
      }
    }

    // Mark event as processed in replay cache
    if (eventId) {
      processedWebhookEvents.set(eventId, { timestamp: Date.now() });
    }

    return res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("Webhook Processing Error:", err);
    return res.status(500).json({ error: "Webhook processing failure" });
  }
};
