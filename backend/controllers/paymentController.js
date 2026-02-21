const crypto = require("crypto");
const Razorpay = require("razorpay");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Refund = require("../models/Refund");
const mongoose = require("mongoose");
const { sendOrderConfirmedEmail, sendPharmacyOrderNotification } = require("../utils/emailService");
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
    const order = await Order.findById(req.body.order_id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Important: Amount is calculated on backend (Order total in INR)
    const amountInPaise = Math.round(order.total * 100);

    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: order._id.toString()
    });

    order.pg_order_id = rzpOrder.id;
    await order.save(); // Save pg order id

    res.json({
      amount: rzpOrder.amount,
      pg_order_id: rzpOrder.id,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error("Create Payment Order Error:", err);
    res.status(500).json({ error: "Failed to create payment order" });
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
    order.payment_status = "paid";
    order.order_status = "confirmed";
    order.pg_payment_id = pg_payment_id;
    order.status_history.push({ status: "confirmed", timestamp: new Date() });

    // Store payment
    await Payment.create({
      order_id,
      pg_order_id,
      pg_payment_id,
      amount: order.total,
      status: "SUCCESS",
      method: "ONLINE"
    });

    // Notify Customer & Pharmacy
    try {
      const user = await User.findById(order.user_id);
      if (user && !order.emailSent?.confirmed) {
        await sendOrderConfirmedEmail(user.email, user.name, order.orderNumber);
        order.emailSent = order.emailSent || {};
        order.emailSent.confirmed = true;
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
    } catch(err) {
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
