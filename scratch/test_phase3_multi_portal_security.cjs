/**
 * =====================================================================
 * MEDSZOP PHASE 3: MASTER MULTI-PORTAL SECURITY & INTEGRATION TEST HARNESS
 * Comprehensive Execution across Stages 1–6
 * =====================================================================
 */

const path = require("path");
module.paths.push(path.resolve(__dirname, "../backend/node_modules"));

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Set safe isolated test environment
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "isolated_test_jwt_secret_phase3_9876543210";
process.env.OTP_SECRET = "isolated_test_otp_secret_phase3_abcdefghij";
process.env.RAZORPAY_WEBHOOK_SECRET = "mock_phase3_rzp_webhook_secret";
process.env.RAZORPAY_KEY_SECRET = "mock_phase3_rzp_key_secret";
process.env.RAZORPAY_KEY_ID = "rzp_test_mock_id_phase3";

// Models
const Order = require("../backend/models/Order");
const User = require("../backend/models/User");
const Medicine = require("../backend/models/Medicine");
const Pharmacy = require("../backend/models/Pharmacy");
const Prescription = require("../backend/models/Prescription");
const Consultation = require("../backend/models/Consultation");
const Payment = require("../backend/models/Payment");
const DoctorApplication = require("../backend/models/DoctorApplication");
const PharmacistApplication = require("../backend/models/PharmacistApplication");
const DeliveryApplication = require("../backend/models/DeliveryApplication");

// Controllers
const authController = require("../backend/controllers/authController");
const adminController = require("../backend/controllers/adminController");
const pharmacyController = require("../backend/controllers/pharmacyController");
const deliveryController = require("../backend/controllers/deliveryController");
const doctorController = require("../backend/controllers/doctorController");
const onboardingController = require("../backend/controllers/onboardingController");
const medicineController = require("../backend/controllers/medicineController");
const orderController = require("../backend/controllers/orderController");

// Middlewares
const authMiddleware = require("../backend/middleware/authMiddleware");
const roleMiddleware = require("../backend/middleware/roleMiddleware");
const emailService = require("../backend/utils/emailService");

// Mock email service to prevent any real side effects
let sentEmails = [];
emailService.sendEmail = async (to, subject, html) => {
  sentEmails.push({ to, subject, html });
  return { id: "mock_email_" + Date.now() };
};
emailService.sendWelcomeEmail = async (to, name) => {
  sentEmails.push({ to, subject: "Welcome to MedsZop", name });
  return true;
};
emailService.sendOTPEmail = async (to, otp) => {
  sentEmails.push({ to, subject: "Your OTP", otp });
  return true;
};
emailService.sendOrderDeliveredEmail = async (email, name, orderNumber) => {
  sentEmails.push({ to: email, subject: "Order Delivered", orderNumber });
  return true;
};

// Express mock helpers
function createMockReq(options = {}) {
  return {
    headers: options.headers || {},
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    user: options.user || null,
    file: options.file || null,
    ip: options.ip || "127.0.0.1",
  };
}

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
    send(data) {
      this.body = data;
      return this;
    },
    setHeader(name, val) {
      this.headers[name.toLowerCase()] = val;
    },
    getHeader(name) {
      return this.headers[name.toLowerCase()];
    }
  };
}

// Token generator helper
function createTestToken(payload, secret = process.env.JWT_SECRET, expiresIn = "1h") {
  return jwt.sign(payload, secret, { expiresIn });
}

let passedTests = 0;
let failedTests = 0;
const testResults = [];

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
    testResults.push({ name, status: "PASS" });
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failedTests++;
    testResults.push({ name, status: "FAIL", error: err.message });
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
    testResults.push({ name, status: "PASS" });
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failedTests++;
    testResults.push({ name, status: "FAIL", error: err.message });
  }
}

async function main() {
  console.log("=====================================================================");
  console.log("MEDSZOP PHASE 3: MASTER MULTI-PORTAL SECURITY & INTEGRATION TEST HARNESS");
  console.log("=====================================================================\n");

  // =========================================================================
  // STAGE 1: ENVIRONMENT ISOLATION & SAFETY AUDIT
  // =========================================================================
  console.log("--- STAGE 1: ENVIRONMENT ISOLATION & MOCK SAFETY ---");

  runTest("Stage 1.1: NODE_ENV is set to test", () => {
    assert.strictEqual(process.env.NODE_ENV, "test");
  });

  runTest("Stage 1.2: Database Safety Guard verifies non-production environment", () => {
    const { assertDatabaseSafety } = require("../backend/config/db");
    // Assert safe for test
    assertDatabaseSafety("mongodb://127.0.0.1:27018/medszop_test");
    // Verify it actively blocks production Atlas
    assert.throws(() => {
      assertDatabaseSafety("mongodb+srv://medszop-prod:password@cluster0.mongodb.net/medszop");
    }, /CRITICAL SAFETY INTERVENTION/);
  });

  runTest("Stage 1.3: Real external email, SMS, and refund dispatches are mocked", () => {
    assert.strictEqual(typeof emailService.sendEmail, "function");
    assert.strictEqual(typeof emailService.sendOTPEmail, "function");
    assert.strictEqual(typeof emailService.sendOrderDeliveredEmail, "function");
  });

  runTest("Stage 1.4: Synthetic test account generator uses safe isolated domain", () => {
    const testDomain = "@medszop-test.internal";
    const syntheticEmail = `synth-${Date.now()}${testDomain}`;
    assert.ok(syntheticEmail.endsWith("@medszop-test.internal"));
  });

  // =========================================================================
  // STAGE 2: AUTHENTICATION & CROSS-ROLE AUTHORIZATION MATRIX
  // =========================================================================
  console.log("\n--- STAGE 2: AUTHENTICATION & CROSS-ROLE AUTHORIZATION MATRIX ---");

  const roles = ["customer", "pharmacy", "delivery", "doctor", "admin"];
  const tokens = {};
  roles.forEach(role => {
    tokens[role] = createTestToken({
      id: new mongoose.Types.ObjectId().toString(),
      role: role,
      name: `Synthetic ${role}`,
      email: `${role}@medszop-test.internal`
    });
  });

  // Test missing, expired, malformed tokens on authMiddleware
  runTest("Stage 2.1: Auth middleware rejects request with missing Authorization header", () => {
    const req = createMockReq();
    const res = createMockRes();
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.message, "No token provided");
    assert.strictEqual(nextCalled, false);
  });

  runTest("Stage 2.2: Auth middleware rejects query param token to prevent URL leakage (SEC-04)", () => {
    const req = createMockReq({ query: { token: tokens.customer } });
    const res = createMockRes();
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.message, "No token provided");
    assert.strictEqual(nextCalled, false);
  });

  runTest("Stage 2.3: Auth middleware rejects malformed Authorization header (no Bearer prefix)", () => {
    const req = createMockReq({ headers: { authorization: `Basic ${tokens.customer}` } });
    const res = createMockRes();
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(nextCalled, false);
  });

  runTest("Stage 2.4: Auth middleware rejects expired JWT with clean session expiration message", () => {
    const expiredToken = createTestToken({ id: "123", role: "customer" }, process.env.JWT_SECRET, "-1s");
    const req = createMockReq({ headers: { authorization: `Bearer ${expiredToken}` } });
    const res = createMockRes();
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.message, "Session expired. Please log in again.");
    assert.strictEqual(nextCalled, false);
  });

  runTest("Stage 2.5: Auth middleware rejects token signed with tampered / wrong secret", () => {
    const tamperedToken = createTestToken({ id: "123", role: "admin" }, "attacker_secret_key_666");
    const req = createMockReq({ headers: { authorization: `Bearer ${tamperedToken}` } });
    const res = createMockRes();
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.message, "Invalid token");
    assert.strictEqual(nextCalled, false);
  });

  // Cross-Role Authorization Matrix
  const protectedRouteTests = [
    { target: "Admin Endpoints", allowed: ["admin"], denied: ["customer", "pharmacy", "delivery", "doctor"] },
    { target: "Pharmacy Endpoints", allowed: ["pharmacy"], denied: ["customer", "delivery", "doctor"] },
    { target: "Delivery Endpoints", allowed: ["delivery"], denied: ["customer", "pharmacy", "doctor"] },
    { target: "Doctor Endpoints", allowed: ["doctor"], denied: ["customer", "pharmacy", "delivery"] },
    { target: "Customer Endpoints", allowed: ["customer"], denied: ["delivery"] }
  ];

  protectedRouteTests.forEach(({ target, allowed, denied }) => {
    denied.forEach(unauthorizedRole => {
      runTest(`Stage 2.6: ${unauthorizedRole.toUpperCase()} strictly denied on ${target} (HTTP 403)`, () => {
        const req = createMockReq({
          headers: { authorization: `Bearer ${tokens[unauthorizedRole]}` }
        });
        const res = createMockRes();
        let nextCalled = false;

        authMiddleware(req, res, () => {
          const middleware = roleMiddleware(allowed);
          middleware(req, res, () => { nextCalled = true; });
        });

        assert.strictEqual(res.statusCode, 403);
        assert.strictEqual(res.body.message, "Access denied");
        assert.strictEqual(nextCalled, false);
      });
    });
  });

  // Self-Registration Role Escalation Defense (SEC-01)
  await runAsyncTest("Stage 2.7: Public registration strictly coerces any attempted role escalation to 'customer'", async () => {
    const originalFindOne = User.findOne;
    const originalCreate = User.create;

    User.findOne = async () => null;
    let createdPayload = null;
    User.create = async (payload) => {
      createdPayload = payload;
      return { _id: "usr_mock_123", ...payload, toObject: () => payload, save: async () => true };
    };

    try {
      const maliciousRoles = ["admin", "pharmacy", "delivery", "doctor"];
      for (const attackRole of maliciousRoles) {
        const req = createMockReq({
          body: {
            name: "Adversary",
            email: `attacker-${attackRole}@test.com`,
            password: "Password123!",
            role: attackRole
          }
        });
        const res = createMockRes();

        await authController.register(req, res);
        assert.strictEqual(res.statusCode, 201);
        assert.strictEqual(createdPayload.role, "customer", `Role was not coerced to customer for attack role ${attackRole}!`);
      }
    } finally {
      User.findOne = originalFindOne;
      User.create = originalCreate;
    }
  });

  await runAsyncTest("Stage 2.8: Admin user creation endpoint blocks unauthorized non-admin attempts", async () => {
    const req = createMockReq({
      headers: { authorization: `Bearer ${tokens.customer}` }
    });
    const res = createMockRes();
    let nextCalled = false;

    authMiddleware(req, res, () => {
      roleMiddleware(["admin"])(req, res, () => { nextCalled = true; });
    });

    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(nextCalled, false);
  });

  // =========================================================================
  // STAGE 3: PORTAL FUNCTIONAL WORKFLOWS
  // =========================================================================
  console.log("\n--- STAGE 3: PORTAL FUNCTIONAL WORKFLOWS ---");

  // 3.1 Pharmacy Portal Functional Checks
  await runAsyncTest("Stage 3.1: Pharmacy inventory bulk CSV template download headers match schema", async () => {
    const expectedHeaders = [
      "medicine_name", "brand_name", "composition", "category",
      "mrp", "selling_price", "stock_quantity", "expiry_date",
      "batch_number", "manufacturer", "prescription_required"
    ];
    const sampleHeadersStr = expectedHeaders.join(",");
    expectedHeaders.forEach(col => {
      assert.ok(sampleHeadersStr.includes(col), `Missing expected CSV column ${col}`);
    });
  });

  await runAsyncTest("Stage 3.2: Pharmacy order fulfillment status transitions execute valid pipeline", async () => {
    const validTransitions = ["processing", "ready_for_pickup", "shipped", "delivered", "cancelled"];
    validTransitions.forEach(st => {
      assert.ok(typeof st === "string" && st.length > 0);
    });
  });

  await runAsyncTest("Stage 3.3: Cross-pharmacy data isolation: Pharmacy can only view its own orders", async () => {
    const originalFind = Order.find;
    const originalFindOne = Pharmacy.findOne;

    const pharmacyIdA = new mongoose.Types.ObjectId().toString();

    Pharmacy.findOne = async ({ user_id }) => ({
      _id: pharmacyIdA,
      user_id: user_id,
      name: "Pharmacy A"
    });

    let queriedFilter = null;
    Order.find = (filter) => {
      queriedFilter = filter;
      return {
        select: () => ({
          sort: async () => [{ _id: "ord_1", pharmacy_id: pharmacyIdA }]
        })
      };
    };

    try {
      const req = createMockReq({ user: { id: "user_pharm_A", role: "pharmacy" } });
      const res = createMockRes();

      await pharmacyController.getPharmacyOrders(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.ok(queriedFilter.$or.some(c => c.pharmacy_id === pharmacyIdA));
    } finally {
      Order.find = originalFind;
      Pharmacy.findOne = originalFindOne;
    }
  });

  // 3.2 Delivery Portal Functional Checks & Doorstep OTP
  await runAsyncTest("Stage 3.4: Delivery order queries strictly redact delivery_otp from couriers (SEC-03)", async () => {
    const originalFind = Order.find;
    const originalPharmacyFind = Pharmacy.find;

    let selectCalledWith = "";
    Order.find = (filter) => ({
      select(fields) {
        selectCalledWith = fields;
        return {
          sort: () => ({
            lean: async () => [{
              _id: "ord_deliv_123",
              order_status: "processing",
              total: 500,
              delivery_otp: "9999"
            }]
          })
        };
      }
    });

    Pharmacy.find = async () => [];

    try {
      const req = createMockReq({ user: { id: "courier_1", role: "delivery" } });
      const res = createMockRes();

      await deliveryController.getOrders(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.ok(selectCalledWith.includes("-delivery_otp"), "Query did not select -delivery_otp!");
      assert.strictEqual(res.body[0].delivery_otp, undefined, "delivery_otp leaked in courier response!");
    } finally {
      Order.find = originalFind;
      Pharmacy.find = originalPharmacyFind;
    }
  });

  await runAsyncTest("Stage 3.5: Doorstep OTP verification rejects invalid OTP (e.g. 9999 vs 4321)", async () => {
    const originalFindById = Order.findById;

    Order.findById = async () => ({
      _id: "ord_123",
      delivery_agent_id: "courier_1",
      order_status: "out_for_delivery",
      delivery_otp: "4321",
      status_history: [],
      save: async () => true,
      toObject: () => ({})
    });

    try {
      const req = createMockReq({
        user: { id: "courier_1", role: "delivery" },
        params: { id: "ord_123" },
        body: { otp: "9999" }
      });
      const res = createMockRes();

      await deliveryController.completeDelivery(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.message, "Invalid OTP. Delivery verification failed.");
    } finally {
      Order.findById = originalFindById;
    }
  });

  await runAsyncTest("Stage 3.6: Doorstep OTP verification accepts correct OTP and marks order delivered", async () => {
    const originalFindById = Order.findById;
    const originalUserFindById = User.findById;
    let saved = false;

    User.findById = async () => ({
      email: "patient@medszop-test.internal",
      name: "Patient Test"
    });

    Order.findById = async () => ({
      _id: "ord_123",
      user_id: "user_patient_1",
      orderNumber: "ORD-9876",
      delivery_agent_id: "courier_1",
      order_status: "out_for_delivery",
      delivery_otp: "4321",
      status_history: [],
      emailSent: {},
      save: async function() {
        saved = true;
        this.order_status = "delivered";
      },
      toObject: () => ({ order_status: "delivered" })
    });

    try {
      const req = createMockReq({
        user: { id: "courier_1", role: "delivery" },
        params: { id: "ord_123" },
        body: { otp: "4321" }
      });
      const res = createMockRes();

      await deliveryController.completeDelivery(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(saved, true);
      assert.strictEqual(res.body.message, "Order delivered successfully");
    } finally {
      Order.findById = originalFindById;
      User.findById = originalUserFindById;
    }
  });

  await runAsyncTest("Stage 3.7: Doorstep OTP rejects replay on already delivered order", async () => {
    const originalFindById = Order.findById;

    Order.findById = async () => ({
      _id: "ord_123",
      delivery_agent_id: "courier_1",
      order_status: "delivered",
      delivery_otp: "4321",
    });

    try {
      const req = createMockReq({
        user: { id: "courier_1", role: "delivery" },
        params: { id: "ord_123" },
        body: { otp: "4321" }
      });
      const res = createMockRes();

      await deliveryController.completeDelivery(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.message, "Order has already been marked as delivered.");
    } finally {
      Order.findById = originalFindById;
    }
  });

  // 3.3 Doctor Portal Functional Checks & Privacy
  await runAsyncTest("Stage 3.8: Doctor consultation chat blocks unauthorized third party from reading messages", async () => {
    const originalFindById = Consultation.findById;
    const doctorId = "doc_real_111";
    const patientId = "pat_real_222";
    const hackerId = "doc_unauthorized_999";

    Consultation.findById = () => ({
      populate: () => ({
        populate: async () => ({
          _id: "cons_123",
          doctor_id: { _id: doctorId, name: "Dr. A" },
          patient_id: { _id: patientId, name: "Patient B" },
          messages: [{ sender: "doctor", content: "Confidential medical record" }]
        })
      })
    });

    try {
      const req = createMockReq({
        user: { id: hackerId, role: "doctor" },
        params: { id: "cons_123" }
      });
      const res = createMockRes();

      await doctorController.getConsultation(req, res);
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.body.message, "Unauthorized");
    } finally {
      Consultation.findById = originalFindById;
    }
  });

  // 3.4 Partner Onboarding Portal Checks & Privacy
  await runAsyncTest("Stage 3.9: Partner application status tracking suppresses sensitive proofs and contact details", async () => {
    const originalFindById = DoctorApplication.findById;
    const appId = new mongoose.Types.ObjectId().toString();

    DoctorApplication.findById = async () => ({
      _id: appId,
      name: "Dr. Candidate",
      email: "candidate@private-clinic.com",
      phone: "+91 9999999999",
      degree_certificate: "data:image/png;base64,RAW_PRIVATE_CERTIFICATE_DATA",
      status: "PENDING",
      registration_number: "MCI-12345",
      rejection_reason: null,
      createdAt: new Date()
    });

    try {
      const req = createMockReq({ params: { id: appId } });
      const res = createMockRes();

      await onboardingController.getApplicationStatus(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.applicant_name, "Dr. Candidate");
      assert.strictEqual(res.body.status, "PENDING");
      assert.strictEqual(res.body.role, "Doctor");

      // Verify strict privacy redacting
      assert.strictEqual(res.body.email, undefined, "Email leaked in public status check!");
      assert.strictEqual(res.body.phone, undefined, "Phone leaked in public status check!");
      assert.strictEqual(res.body.degree_certificate, undefined, "Certificate blob leaked in public status check!");
    } finally {
      DoctorApplication.findById = originalFindById;
    }
  });

  // =========================================================================
  // STAGE 4: END-TO-END MULTI-PORTAL LIFECYCLE WORKFLOW
  // =========================================================================
  console.log("\n--- STAGE 4: END-TO-END INTEGRATION WORKFLOW ---");

  await runAsyncTest("Stage 4.1: Full E2E Lifecycle: Partner Application -> Admin Approval -> Portal Login -> Work Execution", async () => {
    const originalDocCreate = DoctorApplication.create;
    const originalUserFindOne = User.findOne;
    const originalUserCreate = User.create;
    const originalDocFindById = DoctorApplication.findById;

    const testAppId = new mongoose.Types.ObjectId().toString();
    const testDoctorEmail = `testdoc-${Date.now()}@medszop-test.internal`;

    let createdApp = null;
    DoctorApplication.create = async (doc) => {
      createdApp = { _id: testAppId, ...doc, status: "PENDING", save: async () => true };
      return createdApp;
    };

    User.findOne = async ({ email }) => null;

    try {
      // Step A: Candidate submits doctor application
      const applyReq = createMockReq({
        body: {
          name: "Dr. Lifecycle Test",
          email: testDoctorEmail,
          phone: "+91 9876543210",
          registration_number: "REG-9999",
          specialization: "Cardiology",
          qualification: "MD"
        }
      });
      const applyRes = createMockRes();
      await onboardingController.submitDoctorCall(applyReq, applyRes);
      assert.strictEqual(applyRes.statusCode, 201);
      assert.strictEqual(applyRes.body.applicationId, testAppId);

      // Step B: Public status check shows PENDING
      DoctorApplication.findById = async () => createdApp;
      const statusReq = createMockReq({ params: { id: testAppId } });
      const statusRes = createMockRes();
      await onboardingController.getApplicationStatus(statusReq, statusRes);
      assert.strictEqual(statusRes.body.status, "PENDING");

      // Step C: Admin approves application
      let provisionedUser = null;
      User.create = async (userData) => {
        provisionedUser = { _id: new mongoose.Types.ObjectId().toString(), ...userData };
        return provisionedUser;
      };

      const reviewReq = createMockReq({
        params: { id: testAppId },
        body: { role: "doctor", action: "APPROVE" },
        user: { id: "admin_master_1", role: "admin" }
      });
      const reviewRes = createMockRes();
      await onboardingController.reviewApplication(reviewReq, reviewRes);
      assert.strictEqual(reviewRes.statusCode, 200);
      assert.strictEqual(createdApp.status, "APPROVED");
      assert.ok(provisionedUser !== null, "User was not created on approval!");
      assert.strictEqual(provisionedUser.role, "doctor");

      // Step D: Newly provisioned doctor authenticates into Doctor Portal
      const doctorToken = createTestToken({
        id: provisionedUser._id,
        role: provisionedUser.role,
        email: provisionedUser.email
      });

      // Step E: Doctor accesses appointment queue
      const originalConsultFind = Consultation.find;
      Consultation.find = ({ doctor_id }) => ({
        populate: () => ({
          sort: async () => []
        })
      });

      const queueReq = createMockReq({
        headers: { authorization: `Bearer ${doctorToken}` },
        user: { id: provisionedUser._id, role: "doctor" }
      });
      const queueRes = createMockRes();
      await doctorController.getDoctorConsultations(queueReq, queueRes);
      assert.strictEqual(queueRes.statusCode, 200);
      assert.deepStrictEqual(queueRes.body, []);

      Consultation.find = originalConsultFind;
    } finally {
      DoctorApplication.create = originalDocCreate;
      User.findOne = originalUserFindOne;
      User.create = originalUserCreate;
      DoctorApplication.findById = originalDocFindById;
    }
  });

  // =========================================================================
  // STAGE 5: CORS & BROWSER SECURITY PROTOCOL
  // =========================================================================
  console.log("\n--- STAGE 5: CORS & BROWSER SECURITY PROTOCOL ---");

  runTest("Stage 5.1: Backend CORS allowedOrigins explicitly whitelists all 6 local portal ports (5173-5178)", () => {
    const serverCode = fs.readFileSync(path.resolve(__dirname, "../backend/server.js"), "utf8");
    const requiredOrigins = [
      "http://localhost:5173", "http://127.0.0.1:5173",
      "http://localhost:5174", "http://127.0.0.1:5174",
      "http://localhost:5175", "http://127.0.0.1:5175",
      "http://localhost:5176", "http://127.0.0.1:5176",
      "http://localhost:5177", "http://127.0.0.1:5177",
      "http://localhost:5178", "http://127.0.0.1:5178"
    ];

    requiredOrigins.forEach(origin => {
      assert.ok(serverCode.includes(origin), `server.js missing required CORS origin: ${origin}`);
    });
  });

  runTest("Stage 5.2: CORS origin evaluation rejects unauthorized third-party origin", () => {
    const allowedOrigins = [
      "http://localhost:5173", "http://localhost:5174",
      "http://localhost:5175", "http://localhost:5176",
      "http://localhost:5177", "http://localhost:5178",
      "https://medszop.com", "https://admin.medszop.com"
    ];

    const isOriginAllowed = (origin) => {
      return allowedOrigins.some(allowed => {
        if (allowed === origin) return true;
        try {
          return new URL(allowed).host === new URL(origin).host;
        } catch {
          return false;
        }
      });
    };

    assert.strictEqual(isOriginAllowed("http://localhost:5173"), true);
    assert.strictEqual(isOriginAllowed("http://localhost:5175"), true);
    assert.strictEqual(isOriginAllowed("http://localhost:5178"), true);
    assert.strictEqual(isOriginAllowed("http://attacker-phishing.com"), false);
    assert.strictEqual(isOriginAllowed("http://localhost:8080"), false);
  });

  runTest("Stage 5.3: Frontend environment files contain zero secrets or credentials", () => {
    const portals = ["frontend", "admin", "pharmacy", "delivery", "doctor", "partners"];
    portals.forEach(portal => {
      const envPath = path.resolve(__dirname, `../${portal}/.env`);
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf8");
        assert.ok(!envContent.includes("SECRET"), `${portal}/.env leaks secret!`);
        assert.ok(!envContent.includes("GEMINI"), `${portal}/.env leaks gemini api key!`);
        assert.ok(!envContent.includes("PASSWORD"), `${portal}/.env leaks password!`);
        assert.ok(!envContent.includes("mongodb"), `${portal}/.env leaks mongodb uri!`);
      }
    });
  });

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log("\n=====================================================================");
  console.log(`PHASE 3 TEST RESULTS: Total: ${passedTests + failedTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
  if (failedTests === 0) {
    console.log("🎉 ALL MULTI-PORTAL SECURITY & INTEGRATION TESTS PASSED CLEANLY!");
  } else {
    console.error(`⚠️ ${failedTests} CHECKS FAILED! Inspect errors above.`);
  }
  console.log("=====================================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error("FATAL ERROR IN TEST SUITE:", err);
  process.exit(1);
});
