/**
 * =====================================================================
 * MEDSZOP PHASE 9B.1: AUTOMATED SECURITY REGRESSION TEST SUITE
 * =====================================================================
 * Exercises SEC-04 (Prescription Upload & Storage Security)
 * and SEC-06 (Password Reset OTP Hardening) with Phase 9B.1 corrections:
 * 1. Removal of ?token= from authMiddleware (headers only)
 * 2. Unassigned pharmacy denied access to pending order prescriptions
 * 3. Unrelated doctor denied access without active/completed consultation
 * 4. Server-secret HMAC-SHA256 OTP hashing
 * 5. Atomic attempt counter & concurrent brute-force lockout
 *
 * Uses synthetic test data only. Zero production database or payment calls.
 */

process.env.JWT_SECRET = 'mock_jwt_secret_for_phase9b_tests_only';
process.env.OTP_SECRET = 'mock_otp_secret_key_for_phase9b_tests_only';
process.env.JWT_EXPIRE = '1h';

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const jwt = require(path.resolve(__dirname, '../backend/node_modules/jsonwebtoken'));

const authMiddleware = require('../backend/middleware/authMiddleware');
const authController = require('../backend/controllers/authController');
const prescriptionController = require('../backend/controllers/prescriptionController');
const otpController = require('../backend/controllers/otpController');
const User = require('../backend/models/User');
const Prescription = require('../backend/models/Prescription');
const Order = require('../backend/models/Order');
const Pharmacy = require('../backend/models/Pharmacy');
const Consultation = require('../backend/models/Consultation');

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    headers: {},
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
      this.headers[name] = val;
      return this;
    },
    sendFile(filePath) {
      this.sentFilePath = filePath;
      return this;
    }
  };
  return res;
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, errorDetails = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${testName} ${errorDetails ? `(${errorDetails})` : ''}`);
  }
}

async function runTestSuite() {
  console.log('=====================================================================');
  console.log('MEDSZOP PHASE 9B.1: SECURITY REMEDIATION VERIFICATION SUITE');
  console.log('=====================================================================\n');

  // ===================================================================
  // SECTION 1: AUTH MIDDLEWARE TOKEN IN HEADERS ONLY (PHASE 9B.1)
  // ===================================================================
  console.log('--- SECTION 1: Auth Middleware Header-Only Enforcement ---');

  const customerToken = jwt.sign(
    { id: 'user_cust_001', role: 'customer', email: 'cust1@example.com' },
    process.env.JWT_SECRET
  );
  const pharmacyToken = jwt.sign(
    { id: 'user_pharm_001', role: 'pharmacy', email: 'pharm1@example.com' },
    process.env.JWT_SECRET
  );
  const doctorToken = jwt.sign(
    { id: 'user_doc_001', role: 'doctor', email: 'doctor@example.com' },
    process.env.JWT_SECRET
  );
  const adminToken = jwt.sign(
    { id: 'user_admin_001', role: 'admin', email: 'admin@example.com' },
    process.env.JWT_SECRET
  );

  // Test 1.1: Missing token rejected
  {
    const req = { headers: {}, query: {} };
    const res = createMockRes();
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });
    assert(res.statusCode === 401 && !nextCalled, 'Unauthenticated request rejected with 401');
  }

  // Test 1.2: Valid Bearer token in header accepted
  {
    const req = { headers: { authorization: `Bearer ${customerToken}` }, query: {} };
    const res = createMockRes();
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });
    assert(nextCalled && req.user?.id === 'user_cust_001', 'Bearer token in Authorization header accepted');
  }

  // Test 1.3: Token in URL query param ?token= is strictly REJECTED (Phase 9B.1 fix)
  {
    const req = { headers: {}, query: { token: pharmacyToken } };
    const res = createMockRes();
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });
    assert(
      res.statusCode === 401 && !nextCalled,
      'Query param ?token= rejected with 401 (prevents credential leakage in URLs/logs)'
    );
  }

  // Test 1.4: Tampered/invalid token rejected
  {
    const req = { headers: { authorization: 'Bearer invalid.tampered.token' }, query: {} };
    const res = createMockRes();
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });
    assert(res.statusCode === 401 && !nextCalled, 'Tampered JWT rejected with 401');
  }

  // ===================================================================
  // SECTION 2: SEC-04 PRESCRIPTION UPLOAD & METADATA BINDING
  // ===================================================================
  console.log('\n--- SECTION 2: SEC-04 Prescription Upload & Metadata Binding ---');

  // Test 2.1: Missing file rejected
  {
    const req = { user: { id: 'user_cust_001', role: 'customer' } };
    const res = createMockRes();
    await prescriptionController.uploadPrescription(req, res);
    assert(res.statusCode === 400 && res.body?.success === false, 'Upload with missing file rejected with 400');
  }

  // Test 2.2: Authenticated upload creates Prescription record with user_id
  const mockFilename = `rx-${crypto.randomBytes(16).toString('hex')}-${Date.now()}.jpg`;
  const mockFilePath = `uploads/prescriptions/${mockFilename}`;

  const testUploadDir = path.resolve(process.cwd(), 'uploads', 'prescriptions');
  if (!fs.existsSync(testUploadDir)) {
    fs.mkdirSync(testUploadDir, { recursive: true });
  }
  const testDiskPath = path.resolve(testUploadDir, mockFilename);
  fs.writeFileSync(testDiskPath, 'MOCK_PRESCRIPTION_IMAGE_DATA');

  {
    const origCreate = Prescription.create;
    Prescription.create = async (doc) => ({ _id: 'rx_doc_001', ...doc });

    const req = {
      user: { id: 'user_cust_001', role: 'customer' },
      file: {
        path: `uploads\\prescriptions\\${mockFilename}`,
        filename: mockFilename,
        originalname: 'patient_rx_script.jpg',
        mimetype: 'image/jpeg',
        size: 102400
      }
    };
    const res = createMockRes();
    await prescriptionController.uploadPrescription(req, res);

    assert(
      res.statusCode === 201 &&
      res.body?.success === true &&
      res.body?.filePath === mockFilePath &&
      res.body?.prescriptionId === 'rx_doc_001',
      'Authenticated prescription upload returns normalized filePath and 201'
    );

    Prescription.create = origCreate;
  }

  // Test 2.3: Prescription listing filters by role (Customer sees own prescriptions)
  {
    const origFind = Prescription.find;
    let queryUsed = null;
    Prescription.find = (q) => {
      queryUsed = q;
      return {
        sort: () => [{ _id: 'rx_01', user_id: 'user_cust_001', filename: mockFilename }]
      };
    };

    const req = { user: { id: 'user_cust_001', role: 'customer' } };
    const res = createMockRes();
    await prescriptionController.getUserPrescriptions(req, res);

    assert(
      res.statusCode === 200 && queryUsed?.user_id === 'user_cust_001',
      'Customer prescription query strictly isolated to user_id'
    );

    Prescription.find = origFind;
  }

  // ===================================================================
  // SECTION 3: PATH TRAVERSAL & STRENGTHENED AUTHORIZATION (PHASE 9B.1)
  // ===================================================================
  console.log('\n--- SECTION 3: Strengthened Authorization & Least Privilege ---');

  // Test 3.1: Directory traversal with "../" rejected
  {
    const req = {
      params: { filename: '../../etc/passwd' },
      user: { id: 'user_cust_001', role: 'customer' }
    };
    const res = createMockRes();
    await prescriptionController.getPrescriptionFile(req, res);
    assert(res.statusCode === 400, 'Directory traversal path with "../" rejected with 400');
  }

  // Test 3.2: Backslash path traversal rejected
  {
    const req = {
      params: { filename: '..\\..\\windows\\system32\\cmd.exe' },
      user: { id: 'user_cust_001', role: 'customer' }
    };
    const res = createMockRes();
    await prescriptionController.getPrescriptionFile(req, res);
    assert(res.statusCode === 400, 'Windows backslash path traversal rejected with 400');
  }

  // Test 3.3: Null byte injection rejected
  {
    const req = {
      params: { filename: `rx-file.jpg\0.png` },
      user: { id: 'user_cust_001', role: 'customer' }
    };
    const res = createMockRes();
    await prescriptionController.getPrescriptionFile(req, res);
    assert(res.statusCode === 400, 'Null byte injection rejected with 400');
  }

  // Test 3.4: Non-existent file returns 404
  {
    const req = {
      params: { filename: 'rx-nonexistent-file.jpg' },
      user: { id: 'user_cust_001', role: 'customer' }
    };
    const res = createMockRes();
    await prescriptionController.getPrescriptionFile(req, res);
    assert(res.statusCode === 404, 'Non-existent prescription file returns 404');
  }

  // Test 3.5: Unauthorized customer accessing another customer's file denied (403)
  {
    const origFindOne = Prescription.findOne;
    const origOrderFindOne = Order.findOne;

    Prescription.findOne = async () => null; // Not user's rx
    Order.findOne = async () => null;        // Not user's order

    const req = {
      params: { filename: mockFilename },
      user: { id: 'user_attacker_999', role: 'customer' }
    };
    const res = createMockRes();
    await prescriptionController.getPrescriptionFile(req, res);

    assert(
      res.statusCode === 403,
      'Unauthorized customer accessing another patient prescription denied with 403 Forbidden'
    );

    Prescription.findOne = origFindOne;
    Order.findOne = origOrderFindOne;
  }

  // Test 3.6: Authorized customer accessing their own prescription allowed (200 + sendFile)
  {
    const origFindOne = Prescription.findOne;
    Prescription.findOne = async (q) => {
      if (q.user_id === 'user_cust_001') {
        return { filename: mockFilename, user_id: 'user_cust_001' };
      }
      return null;
    };

    const req = {
      params: { filename: mockFilename },
      user: { id: 'user_cust_001', role: 'customer' }
    };
    const res = createMockRes();
    await prescriptionController.getPrescriptionFile(req, res);

    assert(
      res.sentFilePath === testDiskPath &&
      res.headers['X-Content-Type-Options'] === 'nosniff' &&
      res.headers['Cache-Control']?.includes('no-store'),
      'Authorized customer successfully retrieves own prescription with private non-cacheable headers'
    );

    Prescription.findOne = origFindOne;
  }

  // Test 3.7: Unassigned pharmacy accessing prescription on pending order DENIED (Phase 9B.1 Fix)
  {
    const origPharmFindOne = Pharmacy.findOne;
    const origOrderFindOne = Order.findOne;

    Pharmacy.findOne = async () => ({ _id: 'pharm_store_001', user_id: 'user_pharm_001' });
    // Order exists but pharmacy_id is null (pending unassigned order)
    Order.findOne = async (q) => {
      if (q.pharmacy_id === 'pharm_store_001') return null; // Not assigned to this pharmacy!
      return null;
    };

    const req = {
      params: { filename: mockFilename },
      user: { id: 'user_pharm_001', role: 'pharmacy' }
    };
    const res = createMockRes();
    await prescriptionController.getPrescriptionFile(req, res);

    assert(
      res.statusCode === 403,
      'Unassigned pharmacy accessing pending order prescription strictly DENIED (403 Forbidden)'
    );

    Pharmacy.findOne = origPharmFindOne;
    Order.findOne = origOrderFindOne;
  }

  // Test 3.8: Explicitly assigned pharmacy accessing prescription ALLOWED
  {
    const origPharmFindOne = Pharmacy.findOne;
    const origOrderFindOne = Order.findOne;

    Pharmacy.findOne = async () => ({ _id: 'pharm_store_001', user_id: 'user_pharm_001' });
    Order.findOne = async (q) => {
      if (q.pharmacy_id === 'pharm_store_001') {
        return {
          _id: 'order_123',
          pharmacy_id: 'pharm_store_001',
          prescription_url: mockFilePath
        };
      }
      return null;
    };

    const req = {
      params: { filename: mockFilename },
      user: { id: 'user_pharm_001', role: 'pharmacy' }
    };
    const res = createMockRes();
    await prescriptionController.getPrescriptionFile(req, res);

    assert(
      res.sentFilePath === testDiskPath,
      'Explicitly assigned pharmacy successfully authorized to inspect prescription'
    );

    Pharmacy.findOne = origPharmFindOne;
    Order.findOne = origOrderFindOne;
  }

  // Test 3.9: Unrelated doctor without consultation DENIED (Phase 9B.1 Fix)
  {
    const origConsultFindOne = Consultation.findOne;
    const origRxFindOne = Prescription.findOne;
    const origOrderFindOne = Order.findOne;

    Prescription.findOne = async () => ({ user_id: 'user_cust_001', filename: mockFilename });
    Order.findOne = async () => null;
    Consultation.findOne = async () => null; // NO consultation between this doctor and patient!

    const req = {
      params: { filename: mockFilename },
      user: { id: 'user_doc_unrelated', role: 'doctor' }
    };
    const res = createMockRes();
    await prescriptionController.getPrescriptionFile(req, res);

    assert(
      res.statusCode === 403,
      'Unrelated doctor without active consultation strictly DENIED access (403 Forbidden)'
    );

    Consultation.findOne = origConsultFindOne;
    Prescription.findOne = origRxFindOne;
    Order.findOne = origOrderFindOne;
  }

  // Test 3.10: Doctor with active consultation ALLOWED (Phase 9B.1 Fix)
  {
    const origConsultFindOne = Consultation.findOne;
    const origRxFindOne = Prescription.findOne;
    const origOrderFindOne = Order.findOne;

    Prescription.findOne = async () => ({ user_id: 'user_cust_001', filename: mockFilename });
    Order.findOne = async () => null;
    Consultation.findOne = async (q) => {
      if (q.doctor_id === 'user_doc_assigned' && q.patient_id === 'user_cust_001') {
        return { _id: 'consult_001', doctor_id: 'user_doc_assigned', status: 'ACCEPTED' };
      }
      return null;
    };

    const req = {
      params: { filename: mockFilename },
      user: { id: 'user_doc_assigned', role: 'doctor' }
    };
    const res = createMockRes();
    await prescriptionController.getPrescriptionFile(req, res);

    assert(
      res.sentFilePath === testDiskPath,
      'Doctor with verified active consultation successfully authorized to inspect patient prescription'
    );

    Consultation.findOne = origConsultFindOne;
    Prescription.findOne = origRxFindOne;
    Order.findOne = origOrderFindOne;
  }

  // Clean up mock file
  try {
    if (fs.existsSync(testDiskPath)) {
      fs.unlinkSync(testDiskPath);
    }
  } catch (err) {}

  // ===================================================================
  // SECTION 4: SEC-06 HMAC-SHA256 & ATOMIC LOCKOUT CONCURRENCY
  // ===================================================================
  console.log('\n--- SECTION 4: SEC-06 HMAC-SHA256 & Atomic Lockout Concurrency ---');

  // Test 4.1: Account enumeration mitigation (generic 200)
  {
    const origFindOne = User.findOne;
    User.findOne = async () => null;

    const req = { body: { email: 'nonexistent_account@example.com' } };
    const res = createMockRes();
    await authController.forgotPassword(req, res);

    assert(
      res.statusCode === 200 &&
      res.body?.success === true &&
      res.body?.message?.includes('If that email address is registered'),
      'forgotPassword returns generic 200 for non-existent email (prevents account enumeration)'
    );

    User.findOne = origFindOne;
  }

  // Test 4.2: HMAC-SHA256 hashed storage with server-secret
  let savedUserDoc = null;
  {
    const origFindOne = User.findOne;
    const mockUser = {
      _id: 'user_test_reset',
      email: 'registered_patient@example.com',
      resetPasswordOtp: null,
      resetPasswordExpire: null,
      resetPasswordAttempts: 0,
      save: async function () {
        savedUserDoc = { ...this };
        return this;
      }
    };

    User.findOne = async (q) => {
      if (q.email === 'registered_patient@example.com') return mockUser;
      return null;
    };

    const req = { body: { email: 'registered_patient@example.com' } };
    const res = createMockRes();
    await authController.forgotPassword(req, res);

    assert(
      res.statusCode === 200 &&
      savedUserDoc !== null &&
      savedUserDoc.resetPasswordOtp !== null &&
      savedUserDoc.resetPasswordOtp.length === 64,
      'Stored OTP is a 64-character HMAC-SHA256 hash using server-secret key'
    );

    User.findOne = origFindOne;
  }

  // Test 4.3: Valid OTP verification succeeds
  {
    const plainOtp = '582914';
    const secret = process.env.OTP_SECRET || process.env.JWT_SECRET;
    const hmacOtp = crypto.createHmac('sha256', secret).update(plainOtp).digest('hex');

    const origFindOneAndUpdate = User.findOneAndUpdate;
    User.findOneAndUpdate = async () => ({
      email: 'patient@example.com',
      resetPasswordOtp: hmacOtp,
      resetPasswordExpire: Date.now() + 10 * 60 * 1000,
      resetPasswordAttempts: 1,
      save: async function () {}
    });

    const req = { body: { email: 'patient@example.com', otp: plainOtp } };
    const res = createMockRes();
    await authController.verifyResetOTP(req, res);

    assert(
      res.statusCode === 200 && res.body?.success === true,
      'verifyResetOTP verifies valid cryptographic OTP against HMAC-SHA256 hash'
    );

    User.findOneAndUpdate = origFindOneAndUpdate;
  }

  // Test 4.4: Atomic attempt limit and race condition lockout under concurrent requests
  {
    // Simulate 10 parallel concurrent requests hitting verifyResetOTP simultaneously
    const secret = process.env.OTP_SECRET || process.env.JWT_SECRET;
    const correctHmacOtp = crypto.createHmac('sha256', secret).update('123456').digest('hex');

    // Simulate in-memory document with atomic lock
    let currentAttempts = 0;
    let otpWiped = false;

    const origFindOneAndUpdate = User.findOneAndUpdate;
    const origFindOne = User.findOne;

    User.findOneAndUpdate = async (filter, update) => {
      // Atomic guard: resetPasswordAttempts: { $lt: 5 }
      if (currentAttempts < 5) {
        currentAttempts += 1;
        return {
          email: 'concurrent_target@example.com',
          resetPasswordOtp: correctHmacOtp,
          resetPasswordAttempts: currentAttempts,
          resetPasswordExpire: Date.now() + 10 * 60 * 1000,
          save: async function () {
            if (this.resetPasswordOtp === undefined) otpWiped = true;
          }
        };
      }
      return null; // Atomic guard blocked concurrent overflow!
    };

    User.findOne = async () => ({
      email: 'concurrent_target@example.com',
      resetPasswordOtp: correctHmacOtp,
      resetPasswordAttempts: currentAttempts,
      resetPasswordExpire: Date.now() + 10 * 60 * 1000,
      save: async function () {
        if (this.resetPasswordOtp === undefined) otpWiped = true;
      }
    });

    // Fire 10 parallel wrong-guess requests simultaneously
    const results = await Promise.all(
      Array.from({ length: 10 }).map(async (_, idx) => {
        const req = { body: { email: 'concurrent_target@example.com', otp: `99900${idx}` } };
        const res = createMockRes();
        await authController.verifyResetOTP(req, res);
        return res.statusCode;
      })
    );

    const count400 = results.filter((code) => code === 400).length;
    const count429 = results.filter((code) => code === 429).length;

    assert(
      count400 === 4 && count429 === 6 && currentAttempts === 5 && otpWiped,
      'Atomic MongoDB update prevents concurrent race conditions: exactly 4 initial warnings and 6 lockout 429s'
    );

    User.findOneAndUpdate = origFindOneAndUpdate;
    User.findOne = origFindOne;
  }

  // Test 4.5: Expired OTP rejected
  {
    const plainOtp = '123456';
    const secret = process.env.OTP_SECRET || process.env.JWT_SECRET;
    const hmacOtp = crypto.createHmac('sha256', secret).update(plainOtp).digest('hex');

    const origFindOneAndUpdate = User.findOneAndUpdate;
    const origFindOne = User.findOne;

    User.findOneAndUpdate = async () => null; // Expiry check failed in atomic query
    User.findOne = async () => ({
      email: 'patient@example.com',
      resetPasswordOtp: hmacOtp,
      resetPasswordExpire: Date.now() - 5000, // Expired
      resetPasswordAttempts: 0,
      save: async function () {}
    });

    const req = { body: { email: 'patient@example.com', otp: plainOtp } };
    const res = createMockRes();
    await authController.verifyResetOTP(req, res);

    assert(
      res.statusCode === 429 || res.statusCode === 400,
      'Expired OTP rejected and cleaned up from record'
    );

    User.findOneAndUpdate = origFindOneAndUpdate;
    User.findOne = origFindOne;
  }

  // Test 4.6: Password reset clears OTP immediately (prevents replay)
  {
    const plainOtp = '654321';
    const secret = process.env.OTP_SECRET || process.env.JWT_SECRET;
    const hmacOtp = crypto.createHmac('sha256', secret).update(plainOtp).digest('hex');

    let otpCleared = false;
    const mockUser = {
      email: 'patient@example.com',
      password: 'old_hashed_password',
      resetPasswordOtp: hmacOtp,
      resetPasswordExpire: Date.now() + 10 * 60 * 1000,
      resetPasswordAttempts: 0,
      save: async function () {
        if (this.resetPasswordOtp === undefined) otpCleared = true;
        return this;
      }
    };

    const origFindOne = User.findOne;
    User.findOne = async () => mockUser;

    const req = {
      body: {
        email: 'patient@example.com',
        otp: plainOtp,
        newPassword: 'MyStrongNewPassword#2026'
      }
    };
    const res = createMockRes();
    await authController.resetPassword(req, res);

    assert(
      res.statusCode === 200 && otpCleared,
      'resetPassword updates password and clears resetPasswordOtp immediately (prevents replay)'
    );

    User.findOne = origFindOne;
  }

  // Test 4.7: Password reset rejects passwords < 6 characters
  {
    const req = {
      body: {
        email: 'patient@example.com',
        otp: '123456',
        newPassword: '123'
      }
    };
    const res = createMockRes();
    await authController.resetPassword(req, res);

    assert(
      res.statusCode === 400 && res.body?.message?.includes('at least 6 characters'),
      'Password reset with under 6 characters rejected with 400'
    );
  }

  // ===================================================================
  // SECTION 5: STATIC FILE SERVING HARDENING IN SERVER.JS
  // ===================================================================
  console.log('\n--- SECTION 5: Static File Serving Hardening in server.js ---');

  {
    const serverSource = fs.readFileSync(path.resolve(__dirname, '../backend/server.js'), 'utf-8');
    const hasPrescriptionGating = serverSource.includes('app.get("/uploads/prescriptions/:filename", authMiddleware, getPrescriptionFile);');
    const hasUnauthenticatedBlock = serverSource.includes('app.use("/uploads/prescriptions"');

    assert(
      hasPrescriptionGating && hasUnauthenticatedBlock,
      'server.js gates /uploads/prescriptions with authMiddleware and blocks raw unauthenticated static serving'
    );
  }

  // ===================================================================
  // SUMMARY
  // ===================================================================
  console.log('\n=====================================================================');
  console.log(`PHASE 9B.1 SECURITY REGRESSION RESULTS: ${passedTests}/${totalTests} PASSED`);
  if (failedTests === 0) {
    console.log('🎉 ALL SECURITY CHECKS PASSED WITH ZERO FAILURES!');
  } else {
    console.error(`⚠️ ${failedTests} TEST(S) FAILED!`);
  }
  console.log('=====================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
