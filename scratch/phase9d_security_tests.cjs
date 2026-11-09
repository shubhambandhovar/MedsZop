/**
 * =====================================================================
 * MEDSZOP PHASE 9D: BACKEND HARDENING, DATABASE RELIABILITY & PAYMENT INTEGRITY
 * Comprehensive Automated Verification Suite
 * =====================================================================
 */

const path = require("path");
// Enable loading dependencies from backend/node_modules
module.paths.push(path.resolve(__dirname, "../backend/node_modules"));

const assert = require("assert");
const crypto = require("crypto");
const mongoose = require("mongoose");
const fs = require("fs");

// Load Environment without leaking secrets
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_secret_phase9d";
if (!process.env.RAZORPAY_WEBHOOK_SECRET) process.env.RAZORPAY_WEBHOOK_SECRET = "test_rzp_webhook_secret_9d";
if (!process.env.RAZORPAY_KEY_SECRET) process.env.RAZORPAY_KEY_SECRET = "test_rzp_key_secret_9d";

// Import Models
const Order = require("../backend/models/Order");
const User = require("../backend/models/User");
const Medicine = require("../backend/models/Medicine");
const Pharmacy = require("../backend/models/Pharmacy");
const Prescription = require("../backend/models/Prescription");
const Consultation = require("../backend/models/Consultation");
const Payment = require("../backend/models/Payment");
const Refund = require("../backend/models/Refund");
const WebhookEvent = require("../backend/models/WebhookEvent");

// Import Controllers & Utilities
const medicineController = require("../backend/controllers/medicineController");
const orderController = require("../backend/controllers/orderController");
const paymentController = require("../backend/controllers/paymentController");
const { escapeRegex, cleanNoSqlOperators, mongoSanitize, parsePagination } = require("../backend/middleware/sanitizeMiddleware");
const { createRateLimiter, _inMemoryStore } = require("../backend/utils/rateLimiter");
const safeLogger = require("../backend/utils/logger");
const { getStorageProvider, LocalStorageProvider, S3StorageProvider } = require("../backend/utils/storageService");

// Mock Response Helper
function createMockRes() {
  const headers = {};
  return {
    statusCode: 200,
    headers,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    setHeader(key, val) {
      this.headers[key.toLowerCase()] = val;
    },
    getHeader(key) {
      return this.headers[key.toLowerCase()];
    }
  };
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
  }
}

async function runAsyncTest(description, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log("=====================================================================");
  console.log("MEDSZOP PHASE 9D: BACKEND HARDENING & DATABASE RELIABILITY SUITE");
  console.log("=====================================================================\n");

  // ===================================================================
  // SECTION 1: API SECURITY HARDENING & INPUT SANITIZATION
  // ===================================================================
  console.log("--- SECTION 1: API Security Hardening & Input Sanitization ---");

  // 1.1: Helmet Security Headers in server.js
  runTest("server.js incorporates Helmet with strict CSP and security headers", () => {
    const serverCode = fs.readFileSync(path.resolve(__dirname, "../backend/server.js"), "utf-8");
    assert(serverCode.includes('require("helmet")') || serverCode.includes("helmet("), "Helmet middleware required");
    assert(serverCode.includes("contentSecurityPolicy"), "CSP configured in Helmet");
    assert(serverCode.includes("frameguard"), "Frameguard configured to deny clickjacking");
    assert(serverCode.includes("hsts"), "HSTS configured for SSL enforcement");
  });

  // 1.2: Restricted CORS Configuration in server.js
  runTest("server.js restricts CORS origins to authorized whitelist and denies wildcard in production", () => {
    const serverCode = fs.readFileSync(path.resolve(__dirname, "../backend/server.js"), "utf-8");
    assert(!serverCode.includes('origin: "*"'), 'Wildcard origin: "*" must be replaced');
    assert(serverCode.includes("allowedOrigins"), "Allowed origins array defined");
    assert(serverCode.includes("CORS policy violation"), "CORS rejection error handled");
  });

  // 1.3: NoSQL Operator Injection Stripping
  runTest("cleanNoSqlOperators strips $ operators and dot notation from payloads", () => {
    const maliciousPayload = {
      email: { $gt: "" },
      password: "NormalPassword123",
      $where: "sleep(5000)",
      "profile.admin": true,
      nested: {
        $ne: null,
        safeField: "safeValue"
      }
    };
    const cleaned = cleanNoSqlOperators(maliciousPayload);

    assert(cleaned.email === undefined || typeof cleaned.email === "string" || Object.keys(cleaned.email).length === 0, "$gt stripped");
    assert(cleaned.$where === undefined, "$where operator stripped");
    assert(cleaned["profile.admin"] === undefined, "dot notation stripped");
    assert(cleaned.nested.$ne === undefined, "nested $ne stripped");
    assert(cleaned.nested.safeField === "safeValue", "legitimate safe field preserved");
    assert(cleaned.password === "NormalPassword123", "legitimate password preserved");
  });

  // 1.4: mongoSanitize Express Middleware
  runTest("mongoSanitize middleware cleans req.body, req.query, and req.params", () => {
    const req = {
      body: { search: { $regex: ".*" } },
      query: { role: { $ne: "customer" } },
      params: { id: "123" }
    };
    const res = createMockRes();
    let nextCalled = false;
    mongoSanitize(req, res, () => { nextCalled = true; });

    assert(nextCalled, "next() called by middleware");
    assert(!req.body.search.$regex, "$regex stripped from body");
    assert(!req.query.role.$ne, "$ne stripped from query");
  });

  // 1.5: Sensitive Log Masking
  runTest("safeLogger sanitizes passwords, OTPs, tokens, and patient symptoms", () => {
    const sensitiveLog = {
      user: "patient@medszop.com",
      password: "SecretPassword123",
      otp: "123456",
      token: "eyJhbGciOiJIUzI1NiIsIn...",
      symptoms: "Patient reports severe respiratory infection",
      messages: [{ sender: "patient", content: "medical chat" }]
    };
    const sanitized = safeLogger.sanitize(sensitiveLog);

    assert(sanitized.password === "****", "Password masked");
    assert(sanitized.otp === "****", "OTP masked");
    assert(sanitized.token !== sensitiveLog.token, "Token masked");
    assert(sanitized.symptoms === "****", "Medical symptoms masked");
    assert(sanitized.messages === "****", "Medical chat messages masked");
    assert(sanitized.user === "patient@medszop.com", "Non-sensitive identifier preserved");
  });

  // ===================================================================
  // SECTION 2: SAFE SEARCH & REGEX ReDoS DEFENSE
  // ===================================================================
  console.log("\n--- SECTION 2: Safe Search & Regex ReDoS Defense ---");

  // 2.1: escapeRegex utility
  runTest("escapeRegex neutralizes all regex metacharacters", () => {
    const dangerousPattern = ".*+?^${}()|[]\\";
    const escaped = escapeRegex(dangerousPattern);
    assert.strictEqual(escaped, "\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\");
  });

  // 2.2: ReDoS attack pattern does not crash medicine search
  await runAsyncTest("medicineController.getMedicines safely neutralizes adversarial ReDoS search query", async () => {
    const origMedicineFind = Medicine.find;
    const origPharmacyFind = Pharmacy.find;

    let receivedQuery = null;
    Medicine.find = (q) => {
      receivedQuery = q;
      return {
        limit: () => ({
          lean: async () => [{ _id: "med_1", name: "Paracetamol 500mg" }]
        })
      };
    };
    Pharmacy.find = () => ({
      select: () => ({
        lean: async () => []
      })
    });

    const adversarialQuery = "((((((a+)+)+)+)+)+)$";
    const req = {
      query: { search: adversarialQuery }
    };
    const res = createMockRes();

    await medicineController.getMedicines(req, res);

    assert(res.statusCode === 200, "Adversarial query resolved with 200 without hanging or crashing");
    assert(Array.isArray(res.body), "Response returns array");
    assert(receivedQuery && receivedQuery.$or, "Query built with escaped terms");

    // Verify metacharacters were escaped in query
    const regexPattern = receivedQuery.$or[0].name.$regex;
    assert(regexPattern.includes("\\("), "Parentheses escaped in MongoDB regex query");

    Medicine.find = origMedicineFind;
    Pharmacy.find = origPharmacyFind;
  });

  // 2.3: Non-string search parameter gracefully handled
  await runAsyncTest("medicineController.getMedicines gracefully handles non-string search parameter", async () => {
    const origMedicineFind = Medicine.find;
    const origPharmacyFind = Pharmacy.find;

    Medicine.find = () => ({
      limit: () => ({
        lean: async () => []
      })
    });
    Pharmacy.find = () => ({
      select: () => ({
        lean: async () => []
      })
    });

    const req = { query: { search: ["invalid", "array"] } };
    const res = createMockRes();

    await medicineController.getMedicines(req, res);

    assert(res.statusCode === 200, "Non-string search parameter safely handled");

    Medicine.find = origMedicineFind;
    Pharmacy.find = origPharmacyFind;
  });

  // ===================================================================
  // SECTION 3: PAGINATION & QUERY BOUNDING
  // ===================================================================
  console.log("\n--- SECTION 3: Pagination & Query Bounding ---");

  // 3.1: parsePagination bounds page and limit safely
  runTest("parsePagination enforces safe bounds (min page 1, max limit 100)", () => {
    const p1 = parsePagination({ page: "-5", limit: "999" });
    assert.strictEqual(p1.page, 1, "Negative page clamped to 1");
    assert.strictEqual(p1.limit, 100, "Oversized limit clamped to 100");
    assert.strictEqual(p1.skip, 0, "Skip calculated properly");

    const p2 = parsePagination({ page: "3", limit: "20" });
    assert.strictEqual(p2.page, 3, "Page parsed");
    assert.strictEqual(p2.limit, 20, "Limit parsed");
    assert.strictEqual(p2.skip, 40, "Skip calculated: (3-1)*20 = 40");
  });

  // 3.2: Medicine pagination headers
  await runAsyncTest("medicineController.getMedicines emits pagination headers without breaking array response", async () => {
    const origMedicineFind = Medicine.find;
    const origPharmacyFind = Pharmacy.find;

    const mockMeds = Array.from({ length: 60 }, (_, i) => ({
      _id: `med_${i}`,
      name: `Medicine ${i}`,
      price: 100
    }));

    Medicine.find = () => ({
      limit: () => ({
        lean: async () => mockMeds
      })
    });
    Pharmacy.find = () => ({
      select: () => ({
        lean: async () => []
      })
    });

    const req = { query: { page: "2", limit: "25" } };
    const res = createMockRes();

    await medicineController.getMedicines(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.length, 25, "Paginated slice returns exactly 25 items");
    assert.strictEqual(res.getHeader("x-total-count"), 60, "X-Total-Count header matches total items");
    assert.strictEqual(res.getHeader("x-page"), 2, "X-Page header matches requested page");
    assert.strictEqual(res.getHeader("x-limit"), 25, "X-Limit header matches requested limit");

    Medicine.find = origMedicineFind;
    Pharmacy.find = origPharmacyFind;
  });

  // 3.3: Order pagination headers
  await runAsyncTest("orderController.getOrders emits pagination headers and bounds order history", async () => {
    const origCount = Order.countDocuments;
    const origFind = Order.find;

    Order.countDocuments = async () => 45;
    Order.find = () => ({
      sort: () => ({
        skip: (s) => ({
          limit: async (l) => Array.from({ length: l }, (_, i) => ({ _id: `ord_${i}` }))
        })
      })
    });

    const req = {
      user: { id: "user_cust_01", role: "customer" },
      query: { page: "1", limit: "10" }
    };
    const res = createMockRes();

    await orderController.getOrders(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.getHeader("x-total-count"), 45);
    assert.strictEqual(res.getHeader("x-page"), 1);
    assert.strictEqual(res.getHeader("x-limit"), 10);
    assert.strictEqual(res.getHeader("x-total-pages"), 5);

    Order.countDocuments = origCount;
    Order.find = origFind;
  });

  // ===================================================================
  // SECTION 4: MONGODB SCHEMA INDEXES
  // ===================================================================
  console.log("\n--- SECTION 4: MongoDB Schema Index Declarations ---");

  runTest("Order schema declares compound indexes for user, pharmacy, delivery, and gateway queries", () => {
    const indexes = Order.schema.indexes();
    const indexFields = indexes.map((idx) => Object.keys(idx[0]).join(","));

    assert(indexFields.includes("user_id,createdAt"), "Compound index: user_id + createdAt");
    assert(indexFields.includes("pharmacy_id,order_status"), "Compound index: pharmacy_id + order_status");
    assert(indexFields.includes("delivery_agent_id,order_status"), "Compound index: delivery_agent_id + order_status");
    assert(indexFields.includes("pg_order_id"), "Index: pg_order_id");
    assert(indexFields.includes("order_status"), "Index: order_status");
    assert(indexFields.includes("payment_status"), "Index: payment_status");
  });

  runTest("Medicine schema declares compound and text indexes for catalog searches", () => {
    const indexes = Medicine.schema.indexes();
    const indexFields = indexes.map((idx) => Object.keys(idx[0]).join(","));

    assert(indexFields.includes("name,category"), "Compound index: name + category");
    assert(indexFields.includes("generic_name"), "Index: generic_name");
    assert(indexFields.includes("brand"), "Index: brand");
    assert(indexFields.includes("category"), "Index: category");
  });

  runTest("Payment, Prescription, Consultation, and WebhookEvent schemas declare required lookup indexes", () => {
    const pIndexes = Payment.schema.indexes().map((idx) => Object.keys(idx[0]).join(","));
    assert(pIndexes.includes("order_id"), "Payment order_id index");
    assert(pIndexes.includes("pg_payment_id"), "Payment pg_payment_id index");

    const rxIndexes = Prescription.schema.indexes().map((idx) => Object.keys(idx[0]).join(","));
    assert(rxIndexes.includes("user_id,createdAt"), "Prescription user_id + createdAt index");
    assert(rxIndexes.includes("filename"), "Prescription filename index");

    const cIndexes = Consultation.schema.indexes().map((idx) => Object.keys(idx[0]).join(","));
    assert(cIndexes.includes("patient_id,status"), "Consultation patient_id + status index");
    assert(cIndexes.includes("doctor_id,status"), "Consultation doctor_id + status index");

    const whPath = path.resolve(__dirname, "../backend/models/WebhookEvent.js");
    assert(fs.existsSync(whPath), "WebhookEvent model exists");
  });

  // ===================================================================
  // SECTION 5: PAYMENT INTEGRITY & DURABLE DEDUPLICATION
  // ===================================================================
  console.log("\n--- SECTION 5: Payment Integrity & Durable Webhook Deduplication ---");

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signPayload = (rawBuffer, secret) => {
    return crypto.createHmac("sha256", secret).update(rawBuffer).digest("hex");
  };

  // 5.1: Durable WebhookEvent deduplication
  await runAsyncTest("paymentWebhook detects previously processed event in WebhookEvent and ignores replay", async () => {
    const origWhFind = WebhookEvent.findOne;
    const origWhCreate = WebhookEvent.create;

    // Simulate event already marked 'processed' in MongoDB
    WebhookEvent.findOne = async (q) => {
      if (q.event_id === "evt_durable_processed_01") {
        return { event_id: q.event_id, status: "processed" };
      }
      return null;
    };

    const payloadObj = { event: "payment.captured", payload: { payment: { entity: { id: "pay_1", amount: 50000 } } } };
    const rawPayload = Buffer.from(JSON.stringify(payloadObj));
    const sig = signPayload(rawPayload, webhookSecret);

    const req = {
      headers: {
        "x-razorpay-signature": sig,
        "x-razorpay-event-id": "evt_durable_processed_01"
      },
      rawBody: rawPayload,
      body: payloadObj
    };
    const res = createMockRes();

    await paymentController.paymentWebhook(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body?.status, "already_processed");
    assert(res.body?.message?.includes("durable idempotency"));

    WebhookEvent.findOne = origWhFind;
    WebhookEvent.create = origWhCreate;
  });

  // 5.2: In-progress duplicate webhook returns 200 in_progress
  await runAsyncTest("paymentWebhook detects in-progress event from simultaneous worker and avoids double processing", async () => {
    const origWhFind = WebhookEvent.findOne;

    WebhookEvent.findOne = async (q) => {
      if (q.event_id === "evt_in_progress_02") {
        return { event_id: q.event_id, status: "processing" };
      }
      return null;
    };

    const payloadObj = { event: "payment.captured", payload: { payment: { entity: { id: "pay_2", amount: 50000 } } } };
    const rawPayload = Buffer.from(JSON.stringify(payloadObj));
    const sig = signPayload(rawPayload, webhookSecret);

    const req = {
      headers: {
        "x-razorpay-signature": sig,
        "x-razorpay-event-id": "evt_in_progress_02"
      },
      rawBody: rawPayload,
      body: payloadObj
    };
    const res = createMockRes();

    await paymentController.paymentWebhook(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body?.status, "in_progress");

    WebhookEvent.findOne = origWhFind;
  });

  // 5.3: Duplicate key concurrency race condition handled cleanly (E11000)
  await runAsyncTest("paymentWebhook handles simultaneous duplicate key insertion (E11000) safely", async () => {
    const origWhFind = WebhookEvent.findOne;
    const origWhCreate = WebhookEvent.create;

    WebhookEvent.findOne = async () => null; // Not found initially
    WebhookEvent.create = async () => {
      const err = new Error("E11000 duplicate key error collection");
      err.code = 11000;
      throw err;
    };

    const payloadObj = { event: "payment.captured", payload: { payment: { entity: { id: "pay_3", amount: 50000 } } } };
    const rawPayload = Buffer.from(JSON.stringify(payloadObj));
    const sig = signPayload(rawPayload, webhookSecret);

    const req = {
      headers: {
        "x-razorpay-signature": sig,
        "x-razorpay-event-id": "evt_race_condition_03"
      },
      rawBody: rawPayload,
      body: payloadObj
    };
    const res = createMockRes();

    await paymentController.paymentWebhook(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body?.status, "already_processed");

    WebhookEvent.findOne = origWhFind;
    WebhookEvent.create = origWhCreate;
  });

  // ===================================================================
  // SECTION 6: ATOMIC REFUND & VERIFICATION CONCURRENCY LOCKING
  // ===================================================================
  console.log("\n--- SECTION 6: Atomic Refund & Verification Concurrency ---");

  // 6.1: Concurrent refund calls locked atomically
  await runAsyncTest("refundPayment uses atomic findOneAndUpdate lock to prevent double refunding", async () => {
    const origFindOneAndUpdate = Order.findOneAndUpdate;
    let lockAttemptCount = 0;

    const mockOrderId = "507f1f77bcf86cd799439011";

    Order.findOneAndUpdate = async (query, update) => {
      lockAttemptCount++;
      // Only first caller succeeds in acquiring lock
      if (lockAttemptCount === 1) {
        return {
          _id: mockOrderId,
          total: 500,
          pg_payment_id: "pay_rf_01",
          refund_status: "pending_gateway",
          payment_status: "paid",
          save: async function () { return this; }
        };
      }
      // Second concurrent caller fails to match query because refund_status is already pending_gateway
      return null;
    };

    const origOrderFindById = Order.findById;
    Order.findById = async () => ({
      _id: mockOrderId,
      payment_status: "paid",
      pg_payment_id: "pay_rf_01",
      refund_status: "pending_gateway"
    });

    const origRefundCreate = Refund.create;
    Refund.create = async () => ({});

    // Mock Razorpay gateway refund call
    const origRzpRefund = paymentController.razorpay.payments.refund;
    paymentController.razorpay.payments.refund = async () => ({
      id: "rfnd_test_01",
      amount: 50000,
      status: "processed"
    });

    // Caller 1 (acquires lock)
    const req1 = {
      user: { id: "admin_01", role: "admin" },
      body: { order_id: mockOrderId, reason: "Damaged item" }
    };
    const res1 = createMockRes();
    await paymentController.refundPayment(req1, res1);

    // Caller 2 (concurrent duplicate attempt)
    const req2 = {
      user: { id: "admin_01", role: "admin" },
      body: { order_id: mockOrderId, reason: "Customer request" }
    };
    const res2 = createMockRes();
    await paymentController.refundPayment(req2, res2);

    assert.strictEqual(res1.statusCode, 200, "First caller successfully processed refund");
    assert.strictEqual(res2.statusCode, 400, "Second concurrent caller blocked by atomic lock (HTTP 400)");
    assert(res2.body?.message?.includes("already been processed or initiated"), "Correct error message on duplicate refund");

    Order.findOneAndUpdate = origFindOneAndUpdate;
    Order.findById = origOrderFindById;
    Refund.create = origRefundCreate;
    paymentController.razorpay.payments.refund = origRzpRefund;
  });

  // 6.2: Frontend verifyPayment idempotency on paid order
  await runAsyncTest("verifyPayment returns clean 200 without duplicate Payment record when order already paid", async () => {
    const origFindById = Order.findById;
    const origPaymentCreate = Payment.create;
    let paymentRecordsCreated = 0;

    const rzpSecret = process.env.RAZORPAY_KEY_SECRET;
    const payload = "order_pg_paid|pay_already_paid";
    const sig = crypto.createHmac("sha256", rzpSecret).update(payload).digest("hex");

    Order.findById = async () => ({
      _id: "507f1f77bcf86cd799439011",
      user_id: "cust_paid_01",
      pg_order_id: "order_pg_paid",
      total: 500,
      payment_status: "paid" // ALREADY PAID
    });

    Payment.create = async () => {
      paymentRecordsCreated++;
      return {};
    };

    const req = {
      user: { id: "cust_paid_01", role: "customer" },
      body: {
        order_id: "507f1f77bcf86cd799439011",
        pg_order_id: "order_pg_paid",
        pg_payment_id: "pay_already_paid",
        signature: sig
      }
    };
    const res = createMockRes();

    await paymentController.verifyPayment(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body?.message, "Already Paid");
    assert.strictEqual(paymentRecordsCreated, 0, "No duplicate Payment document created");

    Order.findById = origFindById;
    Payment.create = origPaymentCreate;
  });

  // ===================================================================
  // SECTION 7: DISTRIBUTED RATE LIMITING & FAIL-SAFE BEHAVIOR
  // ===================================================================
  console.log("\n--- SECTION 7: Distributed Rate Limiting & Fail-Safe ---");

  // 7.1: Rate limiter emits standard RFC headers and triggers 429
  await runAsyncTest("createRateLimiter enforces rate limit and sets RateLimit-* headers with fail-safe fallback", async () => {
    const limiter = createRateLimiter({
      windowMs: 60 * 1000,
      max: 3,
      message: "Test rate limit reached",
      keyGenerator: () => "test_user_key_limit"
    });

    let lastRes = null;
    for (let i = 0; i < 4; i++) {
      const req = { headers: {}, ip: "127.0.0.1" };
      const res = createMockRes();
      let nextCalled = false;
      await limiter(req, res, () => { nextCalled = true; });
      lastRes = res;
    }

    assert.strictEqual(lastRes.statusCode, 429, "Exceeding limit triggers HTTP 429");
    assert.strictEqual(lastRes.getHeader("ratelimit-limit"), 3, "RateLimit-Limit header matches max");
    assert.strictEqual(lastRes.getHeader("ratelimit-remaining"), 0, "RateLimit-Remaining is 0");
    assert(lastRes.getHeader("retry-after") > 0, "Retry-After header present");
  });

  // 7.2: Fail-safe behavior on Redis error
  await runAsyncTest("createRateLimiter fails safe to in-memory store if Redis client throws error", async () => {
    const faultyRedisClient = {
      multi: () => ({
        incr: () => {},
        pttl: () => {},
        exec: async () => { throw new Error("ECONNREFUSED - Redis host down"); }
      })
    };

    const failSafeLimiter = createRateLimiter({
      windowMs: 60 * 1000,
      max: 5,
      redisClient: faultyRedisClient,
      keyGenerator: () => "test_failsafe_user"
    });

    const req = { headers: {}, ip: "127.0.0.1" };
    const res = createMockRes();
    let nextCalled = false;

    await failSafeLimiter(req, res, () => { nextCalled = true; });

    assert(nextCalled, "Middleware fails safe to in-memory store and calls next() without throwing");
    assert.strictEqual(res.statusCode, 200, "Request allowed through in-memory fallback");
  });

  // ===================================================================
  // SECTION 8: PRESCRIPTION STORAGE READINESS
  // ===================================================================
  console.log("\n--- SECTION 8: Prescription Storage Readiness ---");

  runTest("LocalStorageProvider accurately saves, reads, and signs local file paths", async () => {
    const provider = new LocalStorageProvider();
    const testBuffer = Buffer.from("%PDF-1.4 test prescription content");
    const testFilename = `test_rx_${Date.now()}.pdf`;

    const saveResult = await provider.saveFile(testBuffer, testFilename);
    assert.strictEqual(saveResult.storage, "local");
    assert.strictEqual(saveResult.filename, testFilename);

    const signedUrl = await provider.getSignedUrl(testFilename);
    assert(signedUrl.includes("/uploads/prescriptions/"), "Signed path points to protected route");

    // Clean up
    await provider.deleteFile(testFilename);
  });

  runTest("S3StorageProvider blueprint generates KMS encrypted upload blueprints and signed URLs", async () => {
    const s3Provider = new S3StorageProvider({
      bucket: "medszop-secure-prescriptions-prod",
      region: "ap-south-1",
      kmsKeyId: "arn:aws:kms:ap-south-1:123456789012:key/test-key"
    });

    const testFilename = "rx_cloud_01.pdf";
    const uploadSpec = await s3Provider.saveFile(Buffer.from("dummy"), testFilename, "application/pdf");
    assert.strictEqual(uploadSpec.storage, "s3");
    assert.strictEqual(uploadSpec.bucket, "medszop-secure-prescriptions-prod");

    const signedUrl = await s3Provider.getSignedUrl(testFilename, 300);
    assert(signedUrl.startsWith("https://medszop-secure-prescriptions-prod.s3.ap-south-1.amazonaws.com/"), "S3 signed URL formatted properly");
  });

  // ===================================================================
  // SUMMARY
  // ===================================================================
  console.log("\n=====================================================================");
  console.log(`PHASE 9D VERIFICATION RESULTS: ${passedTests}/${totalTests} PASSED`);
  if (failedTests === 0) {
    console.log("🎉 ALL PHASE 9D CHECKS PASSED WITH ZERO FAILURES!");
  } else {
    console.error(`⚠️ ${failedTests} TEST(S) FAILED!`);
  }
  console.log("=====================================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error("Test runner fatal error:", err);
  process.exit(1);
});
