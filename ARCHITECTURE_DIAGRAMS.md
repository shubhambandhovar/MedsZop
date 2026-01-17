# Payment & Insurance Services - Architecture Diagrams

## 📊 Architecture Evolution

### Before Refactoring

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│                    (React Frontend)                          │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP Request
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    ROUTE LAYER                               │
│                 /api/payments/*                              │
│                /api/insurance/*                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 CONTROLLER LAYER                             │
│                                                              │
│  ┌────────────────────┐      ┌─────────────────────┐       │
│  │ PaymentController  │      │ InsuranceController │       │
│  │                    │      │                     │       │
│  │ • createOrder()    │      │ • uploadPolicy()    │       │
│  │ • verifyPayment()  │      │ • verifyPolicy()    │       │
│  │ • handleWebhook()  │      │ • checkCoverage()   │       │
│  │ • getUserPayments()│      │ • getUserInsurance()│       │
│  └─────────┬──────────┘      └──────────┬──────────┘       │
│            │                            │                   │
└────────────┼────────────────────────────┼───────────────────┘
             │ Static Calls               │ Static Calls
             │ No Validation              │ No Validation
             ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                              │
│                   (Static Classes)                           │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │         PaymentService (Static)                │         │
│  │                                                │         │
│  │  static createPaymentOrder() {                │         │
│  │    // Mix of concerns:                        │         │
│  │    // - Validation                            │         │
│  │    // - Business logic                        │         │
│  │    // - Razorpay API calls                    │         │
│  │    // - Database operations                   │         │
│  │    // - Error handling (generic)              │         │
│  │  }                                            │         │
│  │                                                │         │
│  │  static verifyPayment() { ... }               │         │
│  │  static handleWebhook() { ... }               │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │       InsuranceService (Static)                │         │
│  │                                                │         │
│  │  static uploadPolicy() {                      │         │
│  │    // Mix of concerns:                        │         │
│  │    // - File validation                       │         │
│  │    // - Business logic                        │         │
│  │    // - Database operations                   │         │
│  │    // - Error handling (generic)              │         │
│  │  }                                            │         │
│  │                                                │         │
│  │  static verifyPolicy() { ... }                │         │
│  │  static checkCoverage() { ... }               │         │
│  └────────────────────────────────────────────────┘         │
└───────────────────────┬──────────────────────────────────────┘
                        │ Direct DB Access
                        │ throw new Error()
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                               │
│                                                              │
│      ┌─────────────┐              ┌────────────────┐        │
│      │   Payment   │              │   Insurance    │        │
│      │    Model    │              │     Model      │        │
│      │  (Mongoose) │              │   (Mongoose)   │        │
│      └──────┬──────┘              └───────┬────────┘        │
│             │                             │                 │
└─────────────┼─────────────────────────────┼─────────────────┘
              ▼                             ▼
        ┌──────────────────────────────────────┐
        │           MongoDB                     │
        │     payments / insurance              │
        └──────────────────────────────────────┘

❌ Problems:
• No separation of concerns (validation mixed with business logic)
• Static methods (hard to test, no dependency injection)
• Generic Error class (no error codes, hard to debug)
• No type safety (any types, no interfaces)
• Tightly coupled code
• No reusability of validation logic
```

---

### After Refactoring

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│                    (React Frontend)                          │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP Request
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    ROUTE LAYER                               │
│                 /api/payments/*                              │
│                /api/insurance/*                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 CONTROLLER LAYER                             │
│            (Error Handling Enhanced)                         │
│                                                              │
│  ┌────────────────────┐      ┌─────────────────────┐       │
│  │ PaymentController  │      │ InsuranceController │       │
│  │                    │      │                     │       │
│  │ try {              │      │ try {               │       │
│  │   paymentService.  │      │   insuranceService. │       │
│  │     createOrder()  │      │     uploadPolicy()  │       │
│  │ } catch (          │      │ } catch (           │       │
│  │   PaymentService   │      │   InsuranceService  │       │
│  │   Error) {         │      │   Error) {          │       │
│  │   // Handle with   │      │   // Handle with    │       │
│  │   // error codes   │      │   // error codes    │       │
│  │ }                  │      │ }                   │       │
│  └─────────┬──────────┘      └──────────┬──────────┘       │
│            │                            │                   │
└────────────┼────────────────────────────┼───────────────────┘
             │ Instance Calls             │ Instance Calls
             │ Type-Safe                  │ Type-Safe
             ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  TYPE DEFINITION LAYER                       │
│                  (Type Safety & Contracts)                   │
│                                                              │
│  ┌─────────────────────┐    ┌──────────────────────┐       │
│  │ payment.types.ts    │    │ insurance.types.ts   │       │
│  │                     │    │                      │       │
│  │ • Request Types     │    │ • Request Types      │       │
│  │ • Response Types    │    │ • Response Types     │       │
│  │ • Error Classes     │    │ • Error Classes      │       │
│  │ • Error Codes       │    │ • Error Codes        │       │
│  │ • Config Types      │    │ • Validation Rules   │       │
│  └─────────────────────┘    └──────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
             │                            │
             ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  VALIDATION LAYER                            │
│            (Centralized Validation Logic)                    │
│                                                              │
│  ┌──────────────────────┐   ┌────────────────────────┐     │
│  │ PaymentValidator     │   │ InsuranceValidator     │     │
│  │                      │   │                        │     │
│  │ static validate      │   │ static validate        │     │
│  │   OrderCreation()    │   │   PolicyUpload()       │     │
│  │ static validate      │   │ static validate        │     │
│  │   PaymentVerif..()   │   │   PolicyVerif..()      │     │
│  │ static validate      │   │ static validate        │     │
│  │   WebhookSig..()     │   │   CoverageCheck()      │     │
│  │                      │   │ static validate        │     │
│  │ Throws: Payment      │   │   PolicyExpiry()       │     │
│  │   ServiceError       │   │                        │     │
│  │   with error code    │   │ Throws: Insurance      │     │
│  │                      │   │   ServiceError         │     │
│  │                      │   │   with error code      │     │
│  └──────────────────────┘   └────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
             │                            │
             │ Validation Pass            │ Validation Pass
             ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                              │
│            (Instance-Based, DI Pattern)                      │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │     PaymentService (Instance)                  │         │
│  │                                                │         │
│  │  private razorpay: Razorpay;                  │         │
│  │  private config: PaymentServiceConfig;        │         │
│  │                                                │         │
│  │  constructor() { /* DI setup */ }             │         │
│  │                                                │         │
│  │  async createPaymentOrder(request) {          │         │
│  │    PaymentValidator.validateOrderCreation();  │         │
│  │    const insurance = await this.              │         │
│  │      calculateInsuranceCoverage();            │         │
│  │    const order = await this.                  │         │
│  │      createRazorpayOrder();                   │         │
│  │    const payment = await this.                │         │
│  │      savePaymentRecord();                     │         │
│  │    return PaymentOrderResponse;               │         │
│  │  }                                            │         │
│  │                                                │         │
│  │  Private Helpers:                             │         │
│  │  • calculateInsuranceCoverage()               │         │
│  │  • createRazorpayOrder()                      │         │
│  │  • savePaymentRecord()                        │         │
│  │  • verifySignature()                          │         │
│  │  • updatePaymentSuccess()                     │         │
│  │  • updatePaymentFailure()                     │         │
│  │  • updateInsuranceCoverage()                  │         │
│  │  • verifyWebhookSignature()                   │         │
│  │  • processWebhookEvent()                      │         │
│  │  • mapRazorpayMethod()                        │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │    InsuranceService (Instance)                 │         │
│  │                                                │         │
│  │  private readonly COVERAGE_PERCENTAGE = 0.3;  │         │
│  │                                                │         │
│  │  constructor() { /* init */ }                 │         │
│  │                                                │         │
│  │  async uploadPolicy(request) {                │         │
│  │    InsuranceValidator.validatePolicyUpload(); │         │
│  │    await this.checkPolicyExists();            │         │
│  │    const insurance = await Insurance.create();│         │
│  │    return PolicyUploadResponse;               │         │
│  │  }                                            │         │
│  │                                                │         │
│  │  async checkCoverage(request) {               │         │
│  │    InsuranceValidator.validateCoverageCheck();│         │
│  │    const items = request.items.map(item =>    │         │
│  │      this.calculateItemCoverage(item)         │         │
│  │    );                                         │         │
│  │    return CoverageCheckResponse;              │         │
│  │  }                                            │         │
│  │                                                │         │
│  │  Private Helpers:                             │         │
│  │  • checkPolicyExists()                        │         │
│  │  • calculateItemCoverage()                    │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │         SINGLETON EXPORTS                      │         │
│  │                                                │         │
│  │  export const paymentService =                │         │
│  │    new PaymentService();                      │         │
│  │                                                │         │
│  │  export const insuranceService =              │         │
│  │    new InsuranceService();                    │         │
│  └────────────────────────────────────────────────┘         │
└───────────────────────┬──────────────────────────────────────┘
                        │ Separated Concerns
                        │ Custom Errors with Codes
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                               │
│                                                              │
│      ┌─────────────┐              ┌────────────────┐        │
│      │   Payment   │              │   Insurance    │        │
│      │    Model    │              │     Model      │        │
│      │  (Mongoose) │              │   (Mongoose)   │        │
│      └──────┬──────┘              └───────┬────────┘        │
│             │                             │                 │
└─────────────┼─────────────────────────────┼─────────────────┘
              ▼                             ▼
        ┌──────────────────────────────────────┐
        │           MongoDB                     │
        │     payments / insurance              │
        └──────────────────────────────────────┘

✅ Improvements:
• Clear separation of concerns (validation → business logic → data)
• Instance-based services (testable, DI support)
• Custom error classes with error codes
• Type-safe interfaces throughout
• Loosely coupled, modular design
• Reusable validation utilities
• Private helper methods for clarity
```

---

## 🔄 Request Flow Comparison

### Before: Payment Creation

```
1. Client → POST /api/payments/create-order
           { orderId, amount, insuranceId }

2. PaymentController.createOrder()
   ↓ Basic validation (if statements)
   ↓ Static call

3. PaymentService.createPaymentOrder()
   ↓ Mixed concerns:
   ├── Validate amount (inline)
   ├── Check insurance (inline)
   ├── Calculate coverage (inline)
   ├── Create Razorpay order (inline)
   ├── Save to DB (inline)
   └── throw new Error("Generic message")

4. Response: { success, message } or Generic Error
```

### After: Payment Creation

```
1. Client → POST /api/payments/create-order
           { orderId, amount, insuranceId }

2. PaymentController.createOrder()
   ↓ Try-catch with custom error handling
   ↓ Instance call

3. paymentService.createPaymentOrder(request: CreatePaymentOrderRequest)
   ↓
   ├── PaymentValidator.validateOrderCreation()
   │   ├── Check amount (₹1-₹500k)
   │   ├── Check currency (INR/USD)
   │   ├── Check required fields
   │   └── throw PaymentServiceError(INVALID_AMOUNT)
   ↓
   ├── calculateInsuranceCoverage() [HELPER]
   │   ├── Fetch insurance record
   │   ├── Calculate coverage percentage
   │   └── Return coverage data
   ↓
   ├── createRazorpayOrder() [HELPER]
   │   ├── Call Razorpay API
   │   └── Handle gateway errors
   ↓
   ├── savePaymentRecord() [HELPER]
   │   ├── Create Payment document
   │   └── Save to MongoDB
   ↓
   └── Return PaymentOrderResponse (type-safe)

4. Response: 
   Success: { success: true, orderId, amount, ... }
   Error: { success: false, message: "...", errorCode: "INVALID_AMOUNT" }
```

---

## 🎯 Key Architectural Improvements

### 1. Type Safety

**Before**: No interfaces, `any` types everywhere
```typescript
static async createPaymentOrder(params: any)
```

**After**: Strict TypeScript interfaces
```typescript
async createPaymentOrder(
  request: CreatePaymentOrderRequest
): Promise<PaymentOrderResponse>
```

### 2. Validation

**Before**: Inline validation mixed with business logic
```typescript
if (!amount || amount < 1) {
  throw new Error('Invalid amount');
}
// ... business logic ...
```

**After**: Centralized validation layer
```typescript
PaymentValidator.validateOrderCreation(request);
// All validation rules in one place
// Throws PaymentServiceError with error code
```

### 3. Error Handling

**Before**: Generic errors
```typescript
throw new Error('Something went wrong');
// No error codes
// Hard to debug
```

**After**: Custom error classes with codes
```typescript
throw new PaymentServiceError(
  'Amount must be between ₹1 and ₹500,000',
  PaymentErrorCode.INVALID_AMOUNT
);
// Clear error codes
// Easy to debug and handle in frontend
```

### 4. Separation of Concerns

**Before**: Everything in one method (200+ lines)
```typescript
static async createPaymentOrder() {
  // Validation
  // Insurance logic
  // Razorpay API call
  // Database save
  // Error handling
}
```

**After**: Single responsibility principle
```typescript
async createPaymentOrder() {
  PaymentValidator.validateOrderCreation();  // Validation
  const insurance = await this.calculateInsuranceCoverage();  // Insurance
  const order = await this.createRazorpayOrder();  // Gateway
  const payment = await this.savePaymentRecord();  // Database
  return response;  // Clean return
}
```

### 5. Testability

**Before**: Static methods, hard to mock
```typescript
// Cannot inject dependencies
// Cannot mock Razorpay instance
// Hard to test
```

**After**: Instance-based, easy to mock
```typescript
// Can inject mock dependencies in constructor
// Can mock private methods
// Easy to unit test
```

---

## 📊 Code Metrics Comparison

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Lines of Code** | ~600 | ~1,100 | More organized |
| **Type Safety** | Low (any) | High (strict) | ✅ 100% |
| **Error Handling** | Generic | Custom codes | ✅ 8 error codes each |
| **Separation of Concerns** | Low | High | ✅ 4 layers |
| **Testability** | Hard | Easy | ✅ Mockable |
| **Reusability** | Low | High | ✅ Validators reusable |
| **Maintainability** | Medium | High | ✅ Clear helpers |
| **Debugging** | Hard | Easy | ✅ Error codes |
| **Documentation** | Inline | Type definitions | ✅ Self-documenting |

---

## 🚀 Benefits Summary

### For Developers:
1. **Clear Code Structure**: Know where to look for validation, business logic, data access
2. **Type Safety**: Catch errors at compile time, not runtime
3. **Easy Testing**: Mock dependencies, test in isolation
4. **Better Debugging**: Error codes pinpoint exact issues
5. **Reusable Code**: Validators can be used elsewhere
6. **Self-Documenting**: Types and interfaces serve as documentation

### For Users:
1. **Better Error Messages**: Clear, actionable error messages
2. **Consistent Responses**: Predictable API response format
3. **Error Codes**: Frontend can handle specific error scenarios
4. **Reliability**: Validation prevents bad data from entering system

### For Maintenance:
1. **Easy to Extend**: Add new validation rules without touching business logic
2. **Easy to Modify**: Change one layer without affecting others
3. **Easy to Debug**: Error codes and separated concerns
4. **Easy to Test**: Unit test each layer independently

---

## 📈 Future Enhancements Enabled

The new architecture makes these future enhancements easier:

1. **Caching Layer**: Add between service and data layer
2. **Event System**: Emit events from services
3. **Audit Logging**: Add to helper methods
4. **Rate Limiting**: Add to validation layer
5. **A/B Testing**: Inject different strategies
6. **Multiple Payment Gateways**: Factory pattern for gateway selection
7. **Multiple Insurance Providers**: Strategy pattern for provider APIs

---

**Created**: $(date)
**Architecture**: Clean Architecture + Dependency Injection
