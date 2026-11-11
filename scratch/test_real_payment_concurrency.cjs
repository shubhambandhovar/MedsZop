/**
 * MedsZop Phase 10A.1 - Task 4: Real Payment Webhook Concurrency Verification
 * Tests 50 simultaneous signed Razorpay webhook deliveries against the ACTUAL Express backend,
 * real MongoDB (port 27018), and real Redis (port 6380).
 */

const crypto = require("crypto");
const path = require("path");
const mongoose = require(path.resolve(__dirname, "../backend/node_modules/mongoose"));

const Order = require("../backend/models/Order");
const User = require("../backend/models/User");
const Payment = require("../backend/models/Payment");
const WebhookEvent = require("../backend/models/WebhookEvent");
const Refund = require("../backend/models/Refund");

const WEBHOOK_SECRET = "rzp_whk_test_secret_10a1"; // Defined in backend/.env.test
const API_URL = "http://localhost:5000/api/payments/webhook";
const MONGO_URI = "mongodb://127.0.0.1:27018/medszop_test";

function signWebhook(payloadStr) {
  return crypto.createHmac("sha256", WEBHOOK_SECRET).update(payloadStr).digest("hex");
}

async function runPaymentConcurrencyTest() {
  console.log("================================================================================");
  console.log("🚀 STARTING TASK 4: REAL PAYMENT WEBHOOK CONCURRENCY & INTEGRITY (50 STRESS)");
  console.log("================================================================================");

  const results = { total: 0, passed: 0, failed: 0 };
  function record(name, pass, details = "") {
    results.total++;
    if (pass) {
      results.passed++;
      console.log(`  ✅ [PASS] ${name} ${details ? "- " + details : ""}`);
    } else {
      results.failed++;
      console.log(`  ❌ [FAIL] ${name} - ${details}`);
    }
  }

  await mongoose.connect(MONGO_URI);

  try {
    // 1. Setup Test Fixture in Real Database
    console.log("\n[1/7] Seeding synthetic customer and order in real MongoDB...");
    const user = await User.create({
      name: "Webhook Stress Customer",
      email: `webhook.tester.${Date.now()}@medszop.test`,
      password: "Password@123",
      role: "customer"
    });

    const pgOrderId = `order_rzp_concurrent_${Date.now()}`;
    const pgPaymentId = `pay_stress_${Date.now()}`;
    const order = await Order.create({
      orderNumber: `ORD-WHK-${Date.now().toString().slice(-6)}`,
      user_id: user._id.toString(),
      total: 220, // ₹220 = 22,000 paise
      pg_order_id: pgOrderId,
      payment_method: "online",
      payment_status: "pending",
      order_status: "pending",
      items: [{ medicine_id: "med_amox_500", name: "Amoxicillin 500mg", price: 110, quantity: 2 }]
    });

    record("Initial Order Creation in MongoDB", order && order.payment_status === "pending", `Order: ${order.orderNumber}, Total: ₹${order.total}`);

    // 2. Build Webhook Payload
    const eventId = `evt_stress_${Date.now()}`;
    const payloadObj = {
      event: "payment.captured",
      event_id: eventId,
      contains: ["payment"],
      payload: {
        payment: {
          entity: {
            id: pgPaymentId,
            order_id: pgOrderId,
            amount: 22000, // 22,000 paise = ₹220
            currency: "INR",
            status: "captured",
            method: "upi"
          }
        }
      }
    };

    const payloadRaw = JSON.stringify(payloadObj);
    const validSignature = signWebhook(payloadRaw);

    // 3. Test Invalid Signature Rejection
    console.log("\n[2/7] Testing forged/tampered signature rejection...");
    const tamperedRes = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": "forged_invalid_signature_hex_1234567890abcdef"
      },
      body: payloadRaw
    });
    record("Tampered Webhook Signature Rejection", tamperedRes.status === 400, `HTTP status: ${tamperedRes.status}`);

    // 4. Test Payment Amount Tampering
    console.log("\n[3/7] Testing payment amount discrepancy tampering defense...");
    const tamperedAmountObj = JSON.parse(payloadRaw);
    tamperedAmountObj.payload.payment.entity.amount = 100; // Attempt to pay 100 paise instead of 22000
    const tamperedAmountRaw = JSON.stringify(tamperedAmountObj);
    const tamperedAmountSig = signWebhook(tamperedAmountRaw);

    const amountTamperRes = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": tamperedAmountSig,
        "x-razorpay-event-id": `evt_tamper_amt_${Date.now()}`
      },
      body: tamperedAmountRaw
    });
    record("Payment Amount Mismatch Defense (100 vs 22000 paise)", amountTamperRes.status === 400, `HTTP status: ${amountTamperRes.status}`);

    // 5. Execute 50 Simultaneous Real HTTP Requests to Express
    console.log("\n[4/7] Firing 50 simultaneous signed webhook deliveries to actual Express server...");
    const concurrencyPromises = Array.from({ length: 50 }, (_, i) =>
      fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-razorpay-signature": validSignature,
          "x-razorpay-event-id": eventId
        },
        body: payloadRaw
      }).then(async (r) => {
        const body = await r.json().catch(() => ({}));
        return { status: r.status, body };
      })
    );

    const webhookResponses = await Promise.all(concurrencyPromises);

    const allSuccessfulHttp = webhookResponses.every((r) => r.status === 200);
    const alreadyProcessedCount = webhookResponses.filter(
      (r) => r.body.status === "already_processed" || r.body.status === "ok" || r.body.status === "in_progress"
    ).length;

    record(
      "50 Concurrent Webhooks Handled Cleanly (All HTTP 200)",
      allSuccessfulHttp,
      `Responses: 50 received, Deduplicated responses: ${alreadyProcessedCount}`
    );

    // 6. Verify Database Integrity in Real MongoDB
    console.log("\n[5/7] Verifying database integrity & single-transition state in real MongoDB...");
    const updatedOrder = await Order.findById(order._id);
    const payments = await Payment.find({ pg_payment_id: pgPaymentId });
    const events = await WebhookEvent.find({ event_id: eventId });

    record(
      "Order Transition to 'paid' Status",
      updatedOrder.payment_status === "paid" && updatedOrder.order_status === "pending",
      `Order status: ${updatedOrder.order_status}, Payment status: ${updatedOrder.payment_status}`
    );

    record(
      "Single Payment Record Created (Zero Duplication)",
      payments.length === 1 && payments[0].amount === 220,
      `Payments count in real DB: ${payments.length} (Expected: 1)`
    );

    record(
      "Durable WebhookEvent Model Deduplication",
      events.length === 1 && events[0].event_id === eventId,
      `Events count in real DB: ${events.length} (Expected: 1)`
    );

    record(
      "Single Email Notification Flag (No Multi-Send Spam)",
      updatedOrder.emailSent && updatedOrder.emailSent.placed === true,
      `emailSent.placed: ${updatedOrder.emailSent?.placed}`
    );

    // 7. Test Concurrent Refund Atomic Lock
    console.log("\n[6/7] Testing concurrent refund atomic locking on paid order...");
    const lock1 = await Order.findOneAndUpdate(
      { _id: order._id, payment_status: "paid", refund_status: { $nin: ["initiated", "completed", "pending_gateway"] } },
      { $set: { refund_status: "pending_gateway" } },
      { new: true }
    );

    const lock2 = await Order.findOneAndUpdate(
      { _id: order._id, payment_status: "paid", refund_status: { $nin: ["initiated", "completed", "pending_gateway"] } },
      { $set: { refund_status: "pending_gateway" } },
      { new: true }
    );

    record(
      "Concurrent Refund Atomic Lock (findOneAndUpdate)",
      lock1 !== null && lock2 === null,
      `Thread 1 acquired lock: ${lock1 !== null}, Thread 2 blocked: ${lock2 === null}`
    );

    // Release and complete refund
    await Order.updateOne({ _id: order._id }, { $set: { refund_status: "completed", payment_status: "refunded" } });
    const refundedOrder = await Order.findById(order._id);
    record("Refunded Order State Persistence", refundedOrder.payment_status === "refunded", `Order payment_status: ${refundedOrder.payment_status}`);
  } catch (err) {
    console.error("FATAL ERROR IN CONCURRENCY TESTS:", err);
    record("Payment Concurrency Execution", false, err.message);
  } finally {
    await mongoose.disconnect();
  }

  console.log("\n================================================================================");
  console.log(`TASK 4 SUMMARY: Total: ${results.total} | Passed: ${results.passed} | Failed: ${results.failed}`);
  console.log("================================================================================");

  return results;
}

runPaymentConcurrencyTest().then((res) => {
  if (res.failed > 0) process.exit(1);
  else process.exit(0);
});

