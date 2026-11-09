/**
 * =====================================================================
 * MEDSZOP PHASE 9A: AUTOMATED SECURITY REGRESSION TEST SUITE
 * =====================================================================
 * Exercises SEC-01, SEC-02, SEC-03, and SEC-05 remediations in isolation.
 * Uses synthetic test data only. Zero production database or payment calls.
 */

process.env.JWT_SECRET = 'mock_jwt_secret_for_tests_only';
process.env.JWT_EXPIRE = '1h';

const User = require('../backend/models/User');
const Order = require('../backend/models/Order');
const Pharmacy = require('../backend/models/Pharmacy');
const roleMiddleware = require('../backend/middleware/roleMiddleware');
const authController = require('../backend/controllers/authController');
const paymentController = require('../backend/controllers/paymentController');
const deliveryController = require('../backend/controllers/deliveryController');
const pharmacyController = require('../backend/controllers/pharmacyController');
const orderController = require('../backend/controllers/orderController');

function createMockRes() {
  const res = {
    statusCode: 200,
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
  console.log('MEDSZOP PHASE 9A: SECURITY REMEDIATION VERIFICATION SUITE');
  console.log('=====================================================================\n');

  // ===================================================================
  // 1. TASK 1 (SEC-01): PUBLIC REGISTRATION PRIVILEGE ESCALATION
  // ===================================================================
  console.log('--- 1. TESTING SEC-01: PUBLIC REGISTRATION PRIVILEGE ESCALATION ---');

  // Backup original User methods
  const origUserFindOne = User.findOne;
  const origUserCreate = User.create;
  const origUserFindById = User.findById;

  User.findById = async () => ({
    _id: 'mock_user_123',
    email: 'mock@test.com',
    name: 'Mock User'
  });

  let capturedRole = null;
  User.findOne = async () => null; // Simulate no existing user
  User.create = async (userData) => {
    capturedRole = userData.role;
    return {
      _id: 'mock_user_123',
      ...userData,
      save: async () => true
    };
  };

  // Test 1.1: Attacker tries role: "admin"
  capturedRole = null;
  const req1 = { body: { name: 'Attacker', email: 'att_admin@test.com', password: 'Password123', role: 'admin' } };
  const res1 = createMockRes();
  await authController.register(req1, res1);
  assert(capturedRole === 'customer', 'Public register with role="admin" is forced to "customer"');
  assert(res1.body?.user?.role === 'customer', 'Response user object reflects customer role');

  // Test 1.2: Attacker tries role: "doctor"
  capturedRole = null;
  const req2 = { body: { name: 'Attacker Doc', email: 'att_doc@test.com', password: 'Password123', role: 'doctor' } };
  const res2 = createMockRes();
  await authController.register(req2, res2);
  assert(capturedRole === 'customer', 'Public register with role="doctor" is forced to "customer"');

  // Test 1.3: Attacker tries role: "delivery"
  capturedRole = null;
  const req3 = { body: { name: 'Attacker Rider', email: 'att_rider@test.com', password: 'Password123', role: 'delivery' } };
  const res3 = createMockRes();
  await authController.register(req3, res3);
  assert(capturedRole === 'customer', 'Public register with role="delivery" is forced to "customer"');

  // Test 1.4: Attacker tries role: "pharmacy"
  capturedRole = null;
  const req4 = { body: { name: 'Attacker Chemist', email: 'att_pharm@test.com', password: 'Password123', role: 'pharmacy' } };
  const res4 = createMockRes();
  await authController.register(req4, res4);
  assert(capturedRole === 'customer', 'Public register with role="pharmacy" is forced to "customer"');

  // Test 1.5: Legitimate customer registration
  capturedRole = null;
  const req5 = { body: { name: 'Real Patient', email: 'patient@test.com', password: 'Password123' } };
  const res5 = createMockRes();
  await authController.register(req5, res5);
  assert(capturedRole === 'customer', 'Standard customer registration creates customer role');

  // Restore User methods
  User.findOne = origUserFindOne;
  User.create = origUserCreate;

  // ===================================================================
  // 2. TASK 2 (SEC-02): UNAUTHORIZED REFUNDS
  // ===================================================================
  console.log('\n--- 2. TESTING SEC-02: UNAUTHORIZED REFUND AUTHORIZATION ---');

  const adminOnlyMiddleware = roleMiddleware(['admin']);

  // Test 2.1: Role middleware rejects customer
  let middlewarePassed = false;
  const resMWCust = createMockRes();
  adminOnlyMiddleware({ user: { id: 'cust_1', role: 'customer' } }, resMWCust, () => { middlewarePassed = true; });
  assert(!middlewarePassed && resMWCust.statusCode === 403, 'roleMiddleware(["admin"]) rejects customer with 403');

  // Test 2.2: Role middleware rejects delivery agent
  middlewarePassed = false;
  const resMWRider = createMockRes();
  adminOnlyMiddleware({ user: { id: 'rider_1', role: 'delivery' } }, resMWRider, () => { middlewarePassed = true; });
  assert(!middlewarePassed && resMWRider.statusCode === 403, 'roleMiddleware(["admin"]) rejects delivery agent with 403');

  // Test 2.3: Role middleware allows admin
  middlewarePassed = false;
  const resMWAdmin = createMockRes();
  adminOnlyMiddleware({ user: { id: 'admin_1', role: 'admin' } }, resMWAdmin, () => { middlewarePassed = true; });
  assert(middlewarePassed, 'roleMiddleware(["admin"]) allows admin role to proceed');

  // Test 2.4: paymentController.refundPayment defense-in-depth rejects non-admin
  const resCtrlCust = createMockRes();
  await paymentController.refundPayment({ user: { id: 'cust_1', role: 'customer' }, body: { order_id: '507f1f77bcf86cd799439011' } }, resCtrlCust);
  assert(resCtrlCust.statusCode === 403, 'refundPayment controller defense-in-depth rejects customer with 403');

  // Test 2.5: Admin refund rejects unpaid order
  const origOrderFindById = Order.findById;
  Order.findById = async () => ({
    _id: '507f1f77bcf86cd799439011',
    payment_status: 'pending',
    pg_payment_id: null,
    total: 500
  });
  const resUnpaid = createMockRes();
  await paymentController.refundPayment({ user: { id: 'admin_1', role: 'admin' }, body: { order_id: '507f1f77bcf86cd799439011' } }, resUnpaid);
  assert(resUnpaid.statusCode === 400 && resUnpaid.body.message.includes('not been successfully paid'), 'Admin refund rejects unpaid order (400 Bad Request)');

  // Test 2.6: Admin refund rejects duplicate refund
  Order.findById = async () => ({
    _id: '507f1f77bcf86cd799439011',
    payment_status: 'paid',
    pg_payment_id: 'pay_123',
    refund_status: 'initiated',
    total: 500
  });
  const resDuplicate = createMockRes();
  await paymentController.refundPayment({ user: { id: 'admin_1', role: 'admin' }, body: { order_id: '507f1f77bcf86cd799439011' } }, resDuplicate);
  assert(resDuplicate.statusCode === 400 && resDuplicate.body.message.includes('already been processed'), 'Admin refund rejects duplicate refund (400 Bad Request)');

  Order.findById = origOrderFindById;

  // ===================================================================
  // 3. TASK 3 (SEC-03): DELIVERY OTP EXPOSURE & MANDATORY VERIFICATION
  // ===================================================================
  console.log('\n--- 3. TESTING SEC-03: DELIVERY OTP EXPOSURE & VERIFICATION ---');

  const origOrderFind = Order.find;
  const origPharmacyFind = Pharmacy.find;

  // Mock synthetic orders with secret OTP
  Order.find = () => ({
    select: function() { return this; },
    sort: function() {
      return {
        lean: async () => [
          { _id: 'ord_1', user_id: 'cust_1', delivery_otp: '7788', pharmacy_id: 'pharm_1', order_status: 'confirmed' }
        ]
      };
    }
  });
  Pharmacy.find = async () => [{ _id: 'pharm_1', name: 'City Pharmacy' }];

  // Test 3.1: deliveryController.getOrders redacts delivery_otp
  const resRiderOrders = createMockRes();
  await deliveryController.getOrders({ user: { id: 'rider_1', role: 'delivery' } }, resRiderOrders);
  const deliveredOrder = resRiderOrders.body?.[0];
  assert(deliveredOrder && deliveredOrder.delivery_otp === undefined, 'getOrders strips delivery_otp from delivery agent response');

  // Test 3.2: deliveryController.acceptDelivery redacts delivery_otp
  Order.findById = async () => ({
    _id: 'ord_1',
    delivery_agent_id: null,
    delivery_otp: '7788',
    status_history: [],
    save: async () => true,
    toObject: function() { return { ...this }; }
  });
  const resAccept = createMockRes();
  await deliveryController.acceptDelivery({ params: { id: 'ord_1' }, user: { id: 'rider_1', role: 'delivery' } }, resAccept);
  assert(resAccept.body?.order?.delivery_otp === undefined, 'acceptDelivery strips delivery_otp from response');

  // Test 3.3: completeDelivery rejects unauthorized delivery agent
  Order.findById = async () => ({
    _id: 'ord_1',
    delivery_agent_id: 'rider_A',
    delivery_otp: '7788',
    order_status: 'out_for_delivery'
  });
  const resUnauthorizedRider = createMockRes();
  await deliveryController.completeDelivery({ params: { id: 'ord_1' }, user: { id: 'rider_B', role: 'delivery' }, body: { otp: '7788' } }, resUnauthorizedRider);
  assert(resUnauthorizedRider.statusCode === 403, 'completeDelivery rejects unassigned delivery agent with 403');

  // Test 3.4: completeDelivery rejects incorrect OTP
  Order.findById = async () => ({
    _id: 'ord_1',
    delivery_agent_id: 'rider_A',
    delivery_otp: '7788',
    order_status: 'out_for_delivery'
  });
  const resWrongOtp = createMockRes();
  await deliveryController.completeDelivery({ params: { id: 'ord_1' }, user: { id: 'rider_A', role: 'delivery' }, body: { otp: '0000' } }, resWrongOtp);
  assert(resWrongOtp.statusCode === 400 && resWrongOtp.body.message.includes('Invalid OTP'), 'completeDelivery rejects incorrect OTP (400 Bad Request)');

  // Test 3.5: completeDelivery succeeds with valid matching OTP
  let orderDelivered = false;
  Order.findById = async () => ({
    _id: 'ord_1',
    delivery_agent_id: 'rider_A',
    delivery_otp: '7788',
    order_status: 'out_for_delivery',
    status_history: [],
    save: async function() { orderDelivered = this.order_status === 'delivered'; return true; }
  });
  const resValidOtp = createMockRes();
  await deliveryController.completeDelivery({ params: { id: 'ord_1' }, user: { id: 'rider_A', role: 'delivery' }, body: { otp: '7788' } }, resValidOtp);
  assert(resValidOtp.statusCode === 200 && orderDelivered, 'completeDelivery succeeds with valid OTP and updates status to "delivered"');

  Order.find = origOrderFind;
  Pharmacy.find = origPharmacyFind;
  Order.findById = origOrderFindById;

  // ===================================================================
  // 4. TASK 4 (SEC-05): ORDER-LEVEL AUTHORIZATION (BOLA/IDOR)
  // ===================================================================
  console.log('\n--- 4. TESTING SEC-05: OBJECT-LEVEL ORDER AUTHORIZATION ---');

  const origPharmacyFindOne = Pharmacy.findOne;

  const sampleOrder = {
    _id: 'ord_secret_999',
    user_id: 'cust_alice',
    pharmacy_id: 'pharm_alpha',
    delivery_agent_id: 'rider_bob',
    order_status: 'confirmed',
    delivery_otp: '4321',
    total: 350,
    toObject: function() { return { ...this }; }
  };

  Order.findById = async () => sampleOrder;
  Pharmacy.findOne = async ({ user_id }) => {
    if (user_id === 'user_pharm_alpha') return { _id: 'pharm_alpha', name: 'Alpha Pharmacy' };
    if (user_id === 'user_pharm_beta') return { _id: 'pharm_beta', name: 'Beta Pharmacy' };
    return null;
  };

  // Test 4.1: Owner Customer Alice can view her own order (with OTP visible)
  const resAlice = createMockRes();
  await orderController.getOrderById({ params: { id: 'ord_secret_999' }, user: { id: 'cust_alice', role: 'customer' } }, resAlice);
  assert(resAlice.statusCode === 200 && resAlice.body.delivery_otp === '4321', 'Customer Alice can view her own order and delivery OTP');

  // Test 4.2: Foreign Customer Eve CANNOT view Alice\'s order
  const resEve = createMockRes();
  await orderController.getOrderById({ params: { id: 'ord_secret_999' }, user: { id: 'cust_eve', role: 'customer' } }, resEve);
  assert(resEve.statusCode === 403, 'Customer Eve is denied access to Alice\'s order (403 Forbidden)');

  // Test 4.3: Unassigned Delivery Agent Charlie CANNOT view Alice\'s order
  const resCharlie = createMockRes();
  await orderController.getOrderById({ params: { id: 'ord_secret_999' }, user: { id: 'rider_charlie', role: 'delivery' } }, resCharlie);
  assert(resCharlie.statusCode === 403, 'Unassigned delivery agent Charlie is denied access (403 Forbidden)');

  // Test 4.4: Assigned Delivery Agent Bob CAN view order (with OTP redacted)
  const resBob = createMockRes();
  await orderController.getOrderById({ params: { id: 'ord_secret_999' }, user: { id: 'rider_bob', role: 'delivery' } }, resBob);
  assert(resBob.statusCode === 200 && resBob.body.delivery_otp === undefined, 'Assigned agent Bob can view order with delivery_otp redacted');

  // Test 4.5: Unrelated Pharmacy Beta CANNOT view Alice\'s order
  const resPharmBeta = createMockRes();
  await orderController.getOrderById({ params: { id: 'ord_secret_999' }, user: { id: 'user_pharm_beta', role: 'pharmacy' } }, resPharmBeta);
  assert(resPharmBeta.statusCode === 403, 'Unrelated Pharmacy Beta is denied access (403 Forbidden)');

  // Test 4.6: Assigned Pharmacy Alpha CAN view Alice\'s order (with OTP redacted)
  const resPharmAlpha = createMockRes();
  await orderController.getOrderById({ params: { id: 'ord_secret_999' }, user: { id: 'user_pharm_alpha', role: 'pharmacy' } }, resPharmAlpha);
  assert(resPharmAlpha.statusCode === 200 && resPharmAlpha.body.delivery_otp === undefined, 'Assigned Pharmacy Alpha can view order with delivery_otp redacted');

  // Test 4.7: Administrator has full operational access
  const resAdmin = createMockRes();
  await orderController.getOrderById({ params: { id: 'ord_secret_999' }, user: { id: 'admin_root', role: 'admin' } }, resAdmin);
  assert(resAdmin.statusCode === 200, 'Administrator can view order for customer support & supervision');

  // Test 4.8: Customer attempting to alter order status is denied
  const resCustUpdate = createMockRes();
  await orderController.updateOrderStatus({ params: { id: 'ord_secret_999' }, user: { id: 'cust_alice', role: 'customer' }, body: { status: 'delivered' } }, resCustUpdate);
  assert(resCustUpdate.statusCode === 403, 'Customer is denied from altering order status (403 Forbidden)');

  // Test 4.9: Unassigned Pharmacy Beta attempting to alter order status is denied
  const resPharmUpdate = createMockRes();
  await orderController.updateOrderStatus({ params: { id: 'ord_secret_999' }, user: { id: 'user_pharm_beta', role: 'pharmacy' }, body: { status: 'processing' } }, resPharmUpdate);
  assert(resPharmUpdate.statusCode === 403, 'Unrelated Pharmacy Beta is denied from updating order status (403 Forbidden)');

  // Test 4.10: Unassigned Delivery Agent Charlie attempting to alter order status is denied
  const resRiderUpdate = createMockRes();
  await orderController.updateOrderStatus({ params: { id: 'ord_secret_999' }, user: { id: 'rider_charlie', role: 'delivery' }, body: { status: 'delivered' } }, resRiderUpdate);
  assert(resRiderUpdate.statusCode === 403, 'Unassigned delivery agent Charlie is denied from updating order status (403 Forbidden)');

  Pharmacy.findOne = origPharmacyFindOne;
  Order.findById = origOrderFindById;

  // ===================================================================
  // SUMMARY RESULTS
  // ===================================================================
  console.log('\n=====================================================================');
  console.log(`PHASE 9A TEST RESULTS: Total Checks: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log('=====================================================================');

  if (failedTests === 0) {
    console.log('🎉 ALL SECURITY REGRESSION CHECKS PASSED CLEANLY (100% SUCCESS).\n');
    process.exit(0);
  } else {
    console.error(`❌ ${failedTests} SECURITY REGRESSION CHECKS FAILED!\n`);
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal Test Harness Error:', err);
  process.exit(1);
});
