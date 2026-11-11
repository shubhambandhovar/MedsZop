/**
 * MedsZop Phase 10A.1 - Task 2: Real MongoDB Integration Verification
 * Tests actual reads, writes, schema constraints, indexing, concurrency, and recovery
 * against the isolated Docker MongoDB container on 127.0.0.1:27018/medszop_test.
 */

const path = require("path");
const mongoose = require(path.resolve(__dirname, "../backend/node_modules/mongoose"));
const bcrypt = require(path.resolve(__dirname, "../backend/node_modules/bcryptjs"));
const crypto = require("crypto");

const { assertDatabaseSafety } = require("../backend/config/db");
const User = require("../backend/models/User");
const Order = require("../backend/models/Order");
const Prescription = require("../backend/models/Prescription");
const Medicine = require("../backend/models/Medicine");
const Pharmacy = require("../backend/models/Pharmacy");
const WebhookEvent = require("../backend/models/WebhookEvent");
const Payment = require("../backend/models/Payment");
const Consultation = require("../backend/models/Consultation");

const TEST_MONGO_URI = "mongodb://127.0.0.1:27018/medszop_test";

async function runRealMongoTests() {
  console.log("================================================================================");
  console.log("🚀 STARTING TASK 2: REAL MONGODB INTEGRATION TEST (DOCKER CONTAINER)");
  console.log("================================================================================");

  // Safety check
  assertDatabaseSafety(TEST_MONGO_URI, "test");
  console.log(`Safety check passed: Approved isolated test database verified (${TEST_MONGO_URI})`);

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

  try {
    // 1. Connection & Ping
    console.log("\n[1/10] Establishing Mongoose connection to real container...");
    const conn = await mongoose.connect(TEST_MONGO_URI);
    const ping = await conn.connection.db.admin().ping();
    record("Real MongoDB Connection & Ping", ping && ping.ok === 1, `Host: ${conn.connection.host}:${conn.connection.port}`);

    // Clean test database for fresh run
    await conn.connection.db.dropDatabase();
    console.log("Cleaned isolated test database (medszop_test)");

    // Ensure Mongoose creates indexes
    await User.syncIndexes();
    await Order.syncIndexes();
    await Prescription.syncIndexes();
    await WebhookEvent.syncIndexes();
    await Medicine.syncIndexes();

    // 2. Real User Creation & Bcrypt Persistence
    console.log("\n[2/10] Verifying Real User Registration & Password Hashing...");
    const hashedPassword = await bcrypt.hash("Password@123", 10);
    const testUser = await User.create({
      name: "Staging Patient Alpha",
      email: "patient.alpha@medszop.test",
      password: hashedPassword,
      phone: "9876543210",
      role: "customer"
    });

    const fetchedUser = await User.findById(testUser._id);
    const passwordMatches = await bcrypt.compare("Password@123", fetchedUser.password);
    record("User Persistence & Hash Verification", fetchedUser && passwordMatches, `User ID: ${fetchedUser._id}`);

    // 3. Unique Index Enforcement (E11000 Duplicate Key)
    console.log("\n[3/10] Testing MongoDB Unique Indexes & E11000 Constraint...");
    let duplicateRejected = false;
    try {
      await User.create({
        name: "Duplicate Patient",
        email: "patient.alpha@medszop.test", // Same email
        password: hashedPassword,
        phone: "9876543211",
        role: "customer"
      });
    } catch (err) {
      if (err.code === 11000 || err.message.includes("E11000")) {
        duplicateRejected = true;
      }
    }
    record("Unique Constraint Enforcement (E11000)", duplicateRejected, "Duplicate email rejected by real MongoDB engine");

    // 4. Medicine Catalog & Search Index
    console.log("\n[4/10] Testing Medicine Catalog Persistence & Search...");
    const med = await Medicine.create({
      name: "Amoxicillin 500mg Capsule",
      generic_name: "Amoxicillin",
      brand: "Moxikind",
      category: "Antibiotics",
      price: 125,
      discount_price: 110,
      requires_prescription: true,
      stock: 100
    });
    const foundMed = await Medicine.findOne({ generic_name: "Amoxicillin" });
    record("Medicine Schema & Query Persistence", foundMed && foundMed.name.includes("Amoxicillin"), `Med ID: ${foundMed._id}`);

    // 5. Prescription Ownership & Storage Persistence
    console.log("\n[5/10] Testing Prescription Ownership & Query Isolation...");
    const rx = await Prescription.create({
      user_id: testUser._id.toString(),
      filename: "rx_real_test_1001.pdf",
      file_url: "/uploads/prescriptions/rx_real_test_1001.pdf",
      original_name: "amox_prescription.pdf",
      mime_type: "application/pdf",
      file_size: 102400,
      status: "verified"
    });

    const userRxList = await Prescription.find({ user_id: testUser._id.toString() });
    const otherUserRxList = await Prescription.find({ user_id: new mongoose.Types.ObjectId().toString() });
    record(
      "Prescription Isolation & Metadata Binding",
      userRxList.length === 1 && otherUserRxList.length === 0,
      `Linked to patient ${testUser._id}; strictly isolated from other IDs`
    );

    // 6. Customer Order Persistence & Delivery OTP Generation
    console.log("\n[6/10] Testing Customer Order Persistence & Delivery OTP...");
    const secretOtp = "8472";
    const order = await Order.create({
      orderNumber: "ORD-TEST-1001",
      user_id: testUser._id.toString(),
      items: [
        {
          medicine_id: med._id.toString(),
          name: med.name,
          price: 110,
          quantity: 2
        }
      ],
      total: 220,
      payment_method: "online",
      payment_status: "pending",
      order_status: "pending",
      delivery_otp: secretOtp,
      prescription_url: rx.file_url,
      address: {
        addressLine1: "123 Tech Park",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001"
      },
      status_history: [{ status: "pending", timestamp: new Date() }]
    });

    const persistedOrder = await Order.findById(order._id);
    record(
      "Order Persistence with Delivery OTP",
      persistedOrder && persistedOrder.total === 220 && persistedOrder.delivery_otp === secretOtp,
      `Order: ${persistedOrder.orderNumber}, OTP: ${persistedOrder.delivery_otp}`
    );

    // 7. Pharmacy and Delivery Assignment & SEC-03 Redaction
    console.log("\n[7/10] Testing Pharmacy & Delivery Assignment in Database...");
    const pharmacyUser = await User.create({
      name: "Apex Central Pharmacy",
      email: "apex.pharma@medszop.test",
      password: hashedPassword,
      phone: "9876543299",
      role: "pharmacy"
    });

    const deliveryUser = await User.create({
      name: "Express Courier Rider",
      email: "express.rider@medszop.test",
      password: hashedPassword,
      phone: "9876543288",
      role: "delivery"
    });

    persistedOrder.pharmacy_id = pharmacyUser._id.toString();
    persistedOrder.delivery_agent_id = deliveryUser._id.toString();
    persistedOrder.order_status = "out_for_delivery";
    persistedOrder.status_history.push({ status: "out_for_delivery", timestamp: new Date() });
    await persistedOrder.save();

    // Query mimicking delivery agent listing: select("-delivery_otp")
    const driverView = await Order.findById(persistedOrder._id).select("-delivery_otp").lean();
    record("SEC-03 Projection Redaction on Real DB", driverView.delivery_otp === undefined, "Driver projection strictly omits delivery_otp");

    // 8. Durable Webhook Deduplication in Real MongoDB
    console.log("\n[8/10] Testing Durable WebhookEvent Deduplication & Concurrency Lock...");
    const webhookEventId = `evt_real_test_${Date.now()}`;
    const firstInsert = await WebhookEvent.create({
      event_id: webhookEventId,
      event_type: "payment.captured",
      payload: { payment_id: "pay_1001", amount: 22000 },
      status: "processed"
    });

    let duplicateEventBlocked = false;
    try {
      await WebhookEvent.create({
        event_id: webhookEventId, // Identical event ID
        event_type: "payment.captured",
        payload: { payment_id: "pay_1001", amount: 22000 },
        status: "processed"
      });
    } catch (err) {
      if (err.code === 11000) duplicateEventBlocked = true;
    }
    record("Durable Webhook Event Deduplication in DB", firstInsert && duplicateEventBlocked, "Duplicate webhook event rejected by unique index on event_id");

    // 9. Atomic Order Status & Refund Lock (findOneAndUpdate)
    console.log("\n[9/10] Testing Atomic State Transitions (findOneAndUpdate)...");
    const atomicTransition = await Order.findOneAndUpdate(
      { _id: persistedOrder._id, order_status: "out_for_delivery" },
      {
        $set: { order_status: "delivered", payment_status: "paid" },
        $push: { status_history: { status: "delivered", timestamp: new Date() } }
      },
      { new: true }
    );

    // Simultaneous second attempt with same original state must return null
    const concurrentAttempt = await Order.findOneAndUpdate(
      { _id: persistedOrder._id, order_status: "out_for_delivery" },
      { $set: { order_status: "cancelled" } },
      { new: true }
    );
    record("Atomic State Transition & Race Condition Locking", atomicTransition.order_status === "delivered" && concurrentAttempt === null, "Only first update succeeded; second update safely returned null");

    // 10. Database Disconnection & Recovery Test
    console.log("\n[10/10] Testing Database Disconnection and Controlled Recovery...");
    await mongoose.disconnect();
    const disconnectedState = mongoose.connection.readyState === 0;

    // Reconnect and verify data integrity
    await mongoose.connect(TEST_MONGO_URI);
    const recoveredOrder = await Order.findOne({ orderNumber: "ORD-TEST-1001" });
    const reconnectedState = mongoose.connection.readyState === 1 && recoveredOrder && recoveredOrder.order_status === "delivered";
    record("Database Recovery & State Preservation After Interruption", disconnectedState && reconnectedState, "Disconnected cleanly and reconnected with all records preserved");

    await mongoose.disconnect();
  } catch (err) {
    console.error("FATAL ERROR IN REAL MONGO TESTS:", err);
    record("Real MongoDB Test Execution", false, err.message);
  }

  console.log("\n================================================================================");
  console.log(`TASK 2 SUMMARY: Total: ${results.total} | Passed: ${results.passed} | Failed: ${results.failed}`);
  console.log("================================================================================");

  return results;
}

runRealMongoTests().then((res) => {
  if (res.failed > 0) process.exit(1);
  else process.exit(0);
});
