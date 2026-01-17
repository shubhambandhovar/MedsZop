# Quick Controller Update Guide

## 🎯 Objective
Update both controllers to use refactored service instances and handle custom errors.

---

## 1. PaymentController Updates

### File: `Backend/src/controllers/paymentController.ts`

### Step 1: Update Imports (Top of file)

```typescript
// BEFORE:
import { PaymentService } from '../services/paymentService';

// AFTER:
import { paymentService } from '../services/paymentService';
import { PaymentServiceError } from '../types/payment.types';
```

### Step 2: Update Method Calls

Replace all `PaymentService.` with `paymentService.` (5 places):

1. **createOrder()**: Line ~20
   ```typescript
   // BEFORE:
   const result = await PaymentService.createPaymentOrder({

   // AFTER:
   const result = await paymentService.createPaymentOrder({
     userId,
     orderId,
     amount: parseFloat(amount),
     currency: 'INR',  // ADD THIS LINE
     insuranceId,
   });
   ```

2. **verifyPayment()**: Line ~51
   ```typescript
   // BEFORE:
   const result = await PaymentService.verifyPayment({
     razorpay_order_id,
     razorpay_payment_id,
     razorpay_signature,
   });

   // AFTER:
   const result = await paymentService.verifyPayment({
     orderId: razorpay_order_id,  // RENAME PARAMETER
     paymentId: razorpay_payment_id,  // RENAME PARAMETER
     signature: razorpay_signature,
   });
   ```

3. **handleWebhook()**: Line ~82
   ```typescript
   // BEFORE:
   await PaymentService.handleWebhook(req.body, signature);

   // AFTER:
   const result = await paymentService.handleWebhook(req.body, signature);
   ```

4. **getPaymentByOrderId()**: Line ~107
   ```typescript
   // BEFORE:
   const payment = await PaymentService.getPaymentByOrderId(orderId);

   // AFTER:
   const payment = await paymentService.getPaymentByOrderId(orderId);
   ```

5. **getUserPayments()**: Line ~133
   ```typescript
   // BEFORE:
   const payments = await PaymentService.getUserPayments(userId, limit);

   // AFTER:
   const payments = await paymentService.getUserPayments(userId, limit);
   ```

### Step 3: Add Custom Error Handling

Add this to EVERY catch block (5 places):

```typescript
catch (error: any) {
  // ADD THIS BLOCK FIRST:
  if (error instanceof PaymentServiceError) {
    return res.status(400).json({
      success: false,
      message: error.message,
      errorCode: error.code,
    });
  }
  
  // KEEP EXISTING:
  console.error('... error:', error);
  return res.status(500).json({
    success: false,
    message: error.message || '...',
  });
}
```

---

## 2. InsuranceController Updates

### File: `Backend/src/controllers/insuranceController.ts`

### Step 1: Update Imports (Top of file)

```typescript
// BEFORE:
import { InsuranceService } from '../services/insuranceService';

// AFTER:
import { insuranceService } from '../services/insuranceService';
import { InsuranceServiceError } from '../types/insurance.types';
```

### Step 2: Update Method Calls

Replace all `InsuranceService.` with `insuranceService.` (7 places):

1. **uploadPolicy()**
   ```typescript
   // BEFORE:
   const result = await InsuranceService.uploadPolicy({...});

   // AFTER:
   const result = await insuranceService.uploadPolicy({...});
   ```

2. **verifyPolicy()**
   ```typescript
   // BEFORE:
   const result = await InsuranceService.verifyPolicy(...);

   // AFTER:
   const result = await insuranceService.verifyPolicy({
     insuranceId,
     status: approved ? 'approved' : 'rejected',
     remarks: rejectionReason,
   });
   ```

3. **checkCoverage()**
   ```typescript
   // BEFORE:
   const result = await InsuranceService.checkCoverage({...});

   // AFTER:
   const result = await insuranceService.checkCoverage({...});
   ```

4. **getUserInsurance()**
   ```typescript
   // BEFORE:
   const insurance = await InsuranceService.getUserInsurance(userId);

   // AFTER:
   const insurance = await insuranceService.getUserInsurance(userId);
   ```

5. **getInsuranceById()**
   ```typescript
   // BEFORE:
   const insurance = await InsuranceService.getInsuranceById(insuranceId);

   // AFTER:
   const insurance = await insuranceService.getInsuranceById(insuranceId);
   ```

6. **getPendingVerifications()**
   ```typescript
   // BEFORE:
   const pending = await InsuranceService.getPendingVerifications(limit);

   // AFTER:
   const pending = await insuranceService.getPendingVerifications(limit);
   ```

7. **deactivateInsurance()**
   ```typescript
   // BEFORE:
   const result = await InsuranceService.deactivateInsurance(insuranceId);

   // AFTER:
   const result = await insuranceService.deactivateInsurance(insuranceId);
   ```

### Step 3: Add Custom Error Handling

Add this to EVERY catch block (7 places):

```typescript
catch (error: any) {
  // ADD THIS BLOCK FIRST:
  if (error instanceof InsuranceServiceError) {
    return res.status(400).json({
      success: false,
      message: error.message,
      errorCode: error.code,
    });
  }
  
  // KEEP EXISTING:
  console.error('... error:', error);
  return res.status(500).json({
    success: false,
    message: error.message || '...',
  });
}
```

---

## 3. Verification Checklist

After making the changes, verify:

- [ ] **PaymentController**: 5 method calls updated
- [ ] **PaymentController**: 5 catch blocks updated
- [ ] **PaymentController**: 2 imports added
- [ ] **InsuranceController**: 7 method calls updated
- [ ] **InsuranceController**: 7 catch blocks updated
- [ ] **InsuranceController**: 2 imports added
- [ ] **No TypeScript errors** in both files
- [ ] **Services compile** without errors

---

## 4. Testing Commands

```bash
# Check for TypeScript errors
cd Backend
npm run build

# Run linter
npm run lint

# Start development server
npm run dev
```

---

## 5. Expected Error Response Format

### Before Refactoring:
```json
{
  "success": false,
  "message": "Generic error message"
}
```

### After Refactoring:
```json
{
  "success": false,
  "message": "Detailed error message",
  "errorCode": "INVALID_AMOUNT"  // NEW
}
```

---

## 6. HTTP Status Code Mapping

| Error Type | Status Code | When to Use |
|------------|-------------|-------------|
| PaymentServiceError | 400 | Validation errors, business logic errors |
| InsuranceServiceError | 400 | Validation errors, business logic errors |
| NOT_FOUND errors | 404 | Resource not found (use in getPaymentByOrderId) |
| Generic errors | 500 | Unexpected errors, system failures |

---

## 7. Model Field Mismatches

### Insurance Model Issue

The Insurance model uses different field names than the refactored service expects. You have two options:

#### Option A: Update Service (Recommended - Less Breaking)

In `insuranceService.ts`, change field names to match model:

```typescript
// Line ~46: uploadPolicy method
const insurance = await Insurance.create({
  userId: new mongoose.Types.ObjectId(request.userId),
  provider: request.provider,
  providerCode: request.providerCode,  // Use model field
  policyNumber: request.policyNumber,
  policyDocumentUrl: request.policyDocument,  // Map to model field
  policyDocumentType: 'pdf',  // Add required field
  totalCoverageLimit: request.coverageAmount,  // Map to model field
  remainingCoverage: request.coverageAmount,
  usedCoverage: 0,
  verificationStatus: 'pending',
  policyEndDate: request.expiryDate,  // Map to model field
  isActive: true,
});
```

#### Option B: Update Model (More Invasive)

Update Insurance model schema to match service expectations (not recommended if other code uses the model).

---

## 8. Quick Find & Replace

Use VS Code's Find & Replace (Ctrl+H) in each controller:

### PaymentController:
- Find: `PaymentService\.`
- Replace: `paymentService.`
- Find all: 5 occurrences

### InsuranceController:
- Find: `InsuranceService\.`
- Replace: `insuranceService.`
- Find all: 7 occurrences

---

## Summary

**Total Changes Needed**:
- 2 files to update
- 12 method calls to change
- 12 catch blocks to enhance
- 4 new imports to add
- ~50 lines of code to modify

**Time Estimate**: 15-20 minutes

**Difficulty**: Low (mostly find & replace)

---

**Created**: $(date)
**For**: Payment & Insurance Services Refactoring
