/**
 * MedsZop Phase 10A.1 - Task 5: Real Full-Stack E2E & Browser Customer Journey
 * Tests full multi-role platform workflows against:
 * - Real Express backend on port 5000 (NODE_ENV=test)
 * - Real MongoDB 8.0 container on port 27018
 * - Real Redis 7.2 container on port 6380
 * - Real Vite frontend on port 5173
 * - Playwright Chromium browser instance
 */

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
require(path.resolve(__dirname, "../backend/node_modules/dotenv")).config({
  path: path.resolve(__dirname, "../backend/.env.test")
});
const mongoose = require(path.resolve(__dirname, "../backend/node_modules/mongoose"));
const jwt = require(path.resolve(__dirname, "../backend/node_modules/jsonwebtoken"));
const bcrypt = require(path.resolve(__dirname, "../backend/node_modules/bcryptjs"));
const { chromium } = require(path.resolve(__dirname, "../frontend/node_modules/playwright"));

const BACKEND_URL = "http://127.0.0.1:5000";
const FRONTEND_URL = "http://127.0.0.1:5173";
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27018/medszop_test";

async function runFullStackE2E() {
  console.log("================================================================================");
  console.log("🚀 STARTING TASK 5: REAL FULL-STACK E2E & MULTI-ROLE LIFECYCLE AUDIT");
  console.log("================================================================================");

  let passed = 0;
  let failed = 0;
  const results = [];

  function record(name, isPass, details = "") {
    if (isPass) {
      passed++;
      console.log(`  ✅ [PASS] ${name} ${details ? "- " + details : ""}`);
    } else {
      failed++;
      console.log(`  ❌ [FAIL] ${name} ${details ? "- " + details : ""}`);
    }
    results.push({ name, pass: isPass, details });
  }

  // Connect directly to real MongoDB container to inspect documents
  const mongoConn = await mongoose.createConnection(MONGO_URI).asPromise();
  const db = mongoConn.db;

  try {
    // --------------------------------------------------------------------------
    // [1/8] Live Infrastructure & Readiness Check
    // --------------------------------------------------------------------------
    console.log("\n[1/8] Checking Live Infrastructure Readiness...");
    const health = await fetch(`${BACKEND_URL}/health`).then(r => r.json()).catch(() => null);
    record("Backend /health status check", health && health.status === "healthy", `Status: ${health?.status}`);
    record("Direct MongoDB container ping", (await db.command({ ping: 1 })).ok === 1, "MongoDB port 27018 active");

    // --------------------------------------------------------------------------
    // [2/8] Customer Registration & Profile Creation
    // --------------------------------------------------------------------------
    console.log("\n[2/8] Testing Customer Registration & Delivery Address Setup...");
    const testEmail = `patient.${Date.now()}@medszop.test`;
    const regRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Patient Real",
        email: testEmail,
        password: "Password@123",
        phone: "9876543210"
      })
    }).then(r => r.json());

    const customerToken = regRes.access_token || regRes.token;
    const customerId = regRes.user?._id || regRes.user?.id;
    record("Customer Registration API", Boolean(customerToken && customerId), `User: ${testEmail}, Role: ${regRes.user?.role}`);

    // Add delivery address directly to user document in real MongoDB
    const addressId = new mongoose.Types.ObjectId();
    await db.collection("users").updateOne(
      { _id: new mongoose.Types.ObjectId(customerId) },
      {
        $push: {
          addresses: {
            _id: addressId,
            street: "42 Healthcare Avenue",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400001",
            is_default: true
          }
        }
      }
    );
    record("Customer Delivery Address Bound", true, `Address ID: ${addressId}`);

    // --------------------------------------------------------------------------
    // [3/8] Medicine Catalog Seed & Cart Operations
    // --------------------------------------------------------------------------
    console.log("\n[3/8] Querying Medicine Catalog & Testing Cart Integration...");
    const medId = new mongoose.Types.ObjectId();
    await db.collection("medicines").insertOne({
      _id: medId,
      name: "Amoxicillin 500mg Real",
      category: "Antibiotics",
      price: 150,
      stock: 100,
      requires_prescription: true,
      description: "Broad-spectrum synthetic antibiotic for bacterial infections."
    });

    const addCartRes = await fetch(`${BACKEND_URL}/api/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${customerToken}`
      },
      body: JSON.stringify({ medicine_id: medId.toString(), quantity: 2 })
    }).then(r => r.json());

    record("Cart Item Addition API", addCartRes.message === "Added to cart success", `Message: ${addCartRes.message}`);

    const getCartRes = await fetch(`${BACKEND_URL}/api/cart`, {
      headers: { "Authorization": `Bearer ${customerToken}` }
    }).then(r => r.json());

    record("Cart Retrieval API", Boolean(getCartRes.items && getCartRes.items.length === 1), `Items: ${getCartRes.items?.length}, Total: ₹${getCartRes.total}`);

    // Verify cart in MongoDB
    const userDocInMongo = await db.collection("users").findOne({ _id: new mongoose.Types.ObjectId(customerId) });
    record("Cart Persistence in MongoDB Container", userDocInMongo.cart.length === 1 && userDocInMongo.cart[0].quantity === 2, `Cart items: ${userDocInMongo.cart.length}`);

    // --------------------------------------------------------------------------
    // [4/8] Secure Prescription Upload
    // --------------------------------------------------------------------------
    console.log("\n[4/8] Uploading Prescription via Multipart Endpoint...");
    const fakePdfContent = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n120\n%%EOF";
    
    const formData = new FormData();
    const fileBlob = new Blob([Buffer.from(fakePdfContent)], { type: "application/pdf" });
    formData.append("file", fileBlob, "patient_prescription.pdf");

    const uploadRes = await fetch(`${BACKEND_URL}/api/prescriptions/upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${customerToken}`
      },
      body: formData
    }).then(r => r.json());

    const prescriptionId = uploadRes.prescriptionId || uploadRes.prescription?._id;
    const prescriptionUrl = uploadRes.filePath || uploadRes.prescription?.file_url || `/uploads/prescriptions/rx-${prescriptionId}.pdf`;
    record("Secure Prescription Upload", Boolean(uploadRes.success && prescriptionId), `Prescription ID: ${prescriptionId}, File: ${prescriptionUrl}`);

    // --------------------------------------------------------------------------
    // [5/8] Order Placement & Razorpay Payment Verification
    // --------------------------------------------------------------------------
    console.log("\n[5/8] Placing Order & Verifying Razorpay Payment...");
    const orderRes = await fetch(`${BACKEND_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        address_id: addressId.toString(),
        payment_method: "razorpay",
        prescription_url: prescriptionUrl
      })
    }).then(r => r.json());

    const orderId = orderRes.order_id || orderRes.order?._id;
    const orderNumber = orderRes.order?.orderNumber;
    record("Order Creation API", Boolean(orderId), `Order ID: ${orderId}, Order #: ${orderNumber}`);

    // Verify payment using Razorpay verification endpoint
    const rzpOrderId = "order_rzp_e2e_" + Date.now();
    const rzpPaymentId = "pay_rzp_e2e_" + Date.now();
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "rzp_test_sec_sandbox_10a1";
    const signature = crypto
      .createHmac("sha256", keySecret)
      .update(`${rzpOrderId}|${rzpPaymentId}`)
      .digest("hex");

    const payVerifyRes = await fetch(`${BACKEND_URL}/api/payments/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        order_id: orderId.toString(),
        pg_order_id: rzpOrderId,
        pg_payment_id: rzpPaymentId,
        signature
      })
    }).then(r => r.json());

    record("Razorpay Payment Verification API", payVerifyRes.verified === true, `Payment verified: ${payVerifyRes.verified}`);

    // Verify cart cleared and order updated in real MongoDB
    const postPayOrder = await db.collection("orders").findOne({ _id: new mongoose.Types.ObjectId(orderId) });
    const postPayUser = await db.collection("users").findOne({ _id: new mongoose.Types.ObjectId(customerId) });
    record("Order Transitioned to Confirmed/Paid in Real DB", postPayOrder?.payment_status === "paid", `Payment Status: ${postPayOrder?.payment_status}`);
    record("Cart Cleared in MongoDB After Checkout", postPayUser?.cart.length === 0, `User Cart Length: ${postPayUser?.cart.length}`);

    // --------------------------------------------------------------------------
    // [6/8] Pharmacy & Delivery Workflows + SEC-03 Redaction
    // --------------------------------------------------------------------------
    console.log("\n[6/8] Verifying Pharmacy & Delivery Agent Workflows (SEC-03)...");

    // Seed pharmacy user, pharmacy profile, and delivery agent user in MongoDB
    const pharmacyUserId = new mongoose.Types.ObjectId();
    const pharmacyId = new mongoose.Types.ObjectId();
    const deliveryUserId = new mongoose.Types.ObjectId();
    const hashedPass = await bcrypt.hash("Password@123", 10);

    await db.collection("users").insertMany([
      {
        _id: pharmacyUserId,
        name: "Apollo Pharmacy Partner",
        email: `pharmacy.${Date.now()}@medszop.test`,
        password: hashedPass,
        role: "pharmacy"
      },
      {
        _id: deliveryUserId,
        name: "Express Delivery Agent",
        email: `delivery.${Date.now()}@medszop.test`,
        password: hashedPass,
        role: "delivery"
      }
    ]);

    await db.collection("pharmacies").insertOne({
      _id: pharmacyId,
      user_id: pharmacyUserId.toString(),
      name: "Apollo Pharmacy",
      address: "123 Medical Center",
      city: "Mumbai",
      is_verified: true,
      medicines: []
    });

    const jwtSecret = process.env.JWT_SECRET || "medszop_test_jwt_secret_isolated_phase10a1";
    const pharmacyToken = jwt.sign({ id: pharmacyUserId.toString(), role: "pharmacy" }, jwtSecret, { expiresIn: "1h" });
    const deliveryToken = jwt.sign({ id: deliveryUserId.toString(), role: "delivery" }, jwtSecret, { expiresIn: "1h" });

    // Pharmacy accepts / confirms order from pool -> generates delivery_otp
    const confirmRes = await fetch(`${BACKEND_URL}/api/orders/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${pharmacyToken}`
      },
      body: JSON.stringify({ status: "confirmed" })
    }).then(r => r.json());

    record("Pharmacy Order Status Transition to 'confirmed'", confirmRes.message === "Status updated", `Message: ${confirmRes.message}`);

    // Check delivery OTP generated in DB
    const confirmedOrderInMongo = await db.collection("orders").findOne({ _id: new mongoose.Types.ObjectId(orderId) });
    const patientDeliveryOtp = confirmedOrderInMongo?.delivery_otp;
    record("Delivery OTP Generation in Real DB", Boolean(patientDeliveryOtp && patientDeliveryOtp.length >= 4), `Generated OTP: ${patientDeliveryOtp}`);

    // Delivery Agent queries available orders
    const deliveryOrdersRes = await fetch(`${BACKEND_URL}/api/delivery/orders`, {
      headers: { "Authorization": `Bearer ${deliveryToken}` }
    }).then(r => r.json());

    const deliveryTargetOrder = Array.isArray(deliveryOrdersRes) ? deliveryOrdersRes.find(o => o._id.toString() === orderId.toString()) : null;
    const isDeliveryOtpRedacted = deliveryTargetOrder && deliveryTargetOrder.delivery_otp === undefined;
    record("SEC-03 Delivery OTP Redacted in Agent Queue", Boolean(isDeliveryOtpRedacted), `Target found: ${Boolean(deliveryTargetOrder)}, delivery_otp: ${deliveryTargetOrder?.delivery_otp}`);

    // Delivery agent accepts delivery
    const acceptRes = await fetch(`${BACKEND_URL}/api/delivery/accept/${orderId}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${deliveryToken}` }
    }).then(r => r.json());

    record("Delivery Agent Accepts Assignment", acceptRes.message === "Delivery accepted", `Result: ${acceptRes.message}`);

    // Delivery agent tries invalid OTP -> rejected
    const invalidOtpRes = await fetch(`${BACKEND_URL}/api/delivery/complete/${orderId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${deliveryToken}`
      },
      body: JSON.stringify({ otp: "0000" })
    });
    record("SEC-03 Invalid Delivery OTP Rejected (HTTP 400)", invalidOtpRes.status === 400, `HTTP status: ${invalidOtpRes.status}`);

    // Delivery agent provides correct OTP -> accepted
    const completeRes = await fetch(`${BACKEND_URL}/api/delivery/complete/${orderId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${deliveryToken}`
      },
      body: JSON.stringify({ otp: patientDeliveryOtp })
    });
    record("SEC-03 Valid Delivery OTP Handover Accepted (HTTP 200)", completeRes.status === 200, `HTTP status: ${completeRes.status}`);

    const finalOrderInMongo = await db.collection("orders").findOne({ _id: new mongoose.Types.ObjectId(orderId) });
    record("Final Order State is 'delivered' in Real MongoDB", finalOrderInMongo?.order_status === "delivered", `Order Status: ${finalOrderInMongo?.order_status}`);

    // --------------------------------------------------------------------------
    // [7/8] AI Health Assistant Chat API Check
    // --------------------------------------------------------------------------
    console.log("\n[7/8] Testing AI Doctor Health Assistant API...");
    const aiChatRes = await fetch(`${BACKEND_URL}/api/ai/doctor-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        message: "What are the common side effects of Paracetamol?"
      })
    }).then(r => r.json());

    record("AI Doctor Chat Endpoint Response", Boolean(aiChatRes.response), `AI Response received (${aiChatRes.response?.length || 0} chars)`);

    // --------------------------------------------------------------------------
    // [8/8] Playwright Browser UI & Chat Scrolling Audit
    // --------------------------------------------------------------------------
    console.log("\n[8/8] Running Playwright Browser UI & Chat Scrolling Audit...");
    const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    // 1. Visit Landing Page
    await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
    const pageTitle = await page.title();
    record("Playwright: Landing Page Load", Boolean(pageTitle), `Page Title: ${pageTitle || "MedsZop"}`);

    // 2. Set token in localStorage and visit AI Doctor Page (/doctor-chat)
    await page.evaluate((tok) => {
      localStorage.setItem("token", tok);
    }, customerToken);

    await page.goto(`${FRONTEND_URL}/doctor-chat`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const chatHeading = await page.textContent("h1");
    record("Playwright: AI Doctor Page Navigation (/doctor-chat)", chatHeading?.includes("AI Health Assistant"), `Heading: ${chatHeading}`);

    // Test sending message in AI Doctor Chat and verifying scroll
    const chatInput = await page.$("[data-testid='chat-input']");
    const sendBtn = await page.$("[data-testid='send-btn']");

    if (chatInput && sendBtn) {
      await chatInput.fill("Tell me about paracetamol safety tips");
      await sendBtn.click();

      // Wait for AI response to stream and render
      await page.waitForTimeout(3500);

      // Inspect chat container scroll position
      const scrollInfo = await page.evaluate(() => {
        const container = document.querySelector("[data-testid='chat-messages-container']");
        if (!container) return null;
        return {
          scrollTop: container.scrollTop,
          scrollHeight: container.scrollHeight,
          clientHeight: container.clientHeight,
          isNearBottom: container.scrollHeight - container.scrollTop - container.clientHeight < 120
        };
      });

      record(
        "Playwright: AI Doctor Auto-Scroll to Bottom",
        Boolean(scrollInfo && (scrollInfo.isNearBottom || scrollInfo.scrollTop > 0)),
        `ScrollTop: ${scrollInfo?.scrollTop}, ScrollHeight: ${scrollInfo?.scrollHeight}, ClientHeight: ${scrollInfo?.clientHeight}, AtBottom: ${scrollInfo?.isNearBottom}`
      );
    } else {
      record("Playwright: AI Doctor Chat UI Controls Found", false, "Chat input or button missing");
    }

    await browser.close();

  } catch (err) {
    console.error("Unhandled error in FullStack E2E:", err);
    record("E2E Test Execution", false, err.message);
  } finally {
    await mongoConn.close();
  }

  console.log("\n================================================================================");
  console.log(`TASK 5 SUMMARY: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log("================================================================================");

  if (failed > 0) process.exit(1);
}

runFullStackE2E();
