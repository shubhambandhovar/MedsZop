# Payment System - Visual Implementation Guide

## 🎨 UI Component Preview

### Payment Method Selector
```
┌─────────────────────────────────────────────────────────────┐
│  Select Payment Method                                      │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │ 📱  UPI            │  │ 💳  Credit/Debit   │            │
│  │                    │  │     Card           │            │
│  │ Pay using Google   │  │ Visa, Mastercard,  │            │
│  │ Pay, PhonePe       │  │ RuPay              │   ✓        │
│  └────────────────────┘  └────────────────────┘            │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │ 🏦  Net Banking    │  │ 👛  Wallets        │            │
│  │                    │  │                    │            │
│  │ All Indian banks   │  │ Paytm, PhonePe,    │            │
│  │ supported          │  │ Amazon Pay         │            │
│  └────────────────────┘  └────────────────────┘            │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │ ⏰  Pay Later      │  │ 🛡️  Insurance      │            │
│  │                    │  │                    │            │
│  │ Buy now, pay       │  │ Pay using your     │            │
│  │ later options      │  │ insurance policy   │            │
│  └────────────────────┘  └────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### Insurance Upload
```
┌─────────────────────────────────────────────────────────────┐
│  🛡️  Upload Insurance Policy                                │
├─────────────────────────────────────────────────────────────┤
│  Insurance Provider                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Select Provider                              ▼      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Policy Number                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Enter your policy number                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Policy Document                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              📄                                      │   │
│  │                                                      │   │
│  │    Click to upload PDF or Image (Max 5MB)           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ℹ️  Your insurance policy will be verified by our    │   │
│  │    team within 24-48 hours. You'll be notified      │   │
│  │    once approved.                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │             Upload Policy                            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Payment Breakdown
```
┌─────────────────────────────────────────────────────────────┐
│  Payment Summary                                            │
├─────────────────────────────────────────────────────────────┤
│  Subtotal                                     ₹500.00       │
│  Delivery Charges                             ₹50.00        │
│  Discount                                   - ₹50.00        │
│  ─────────────────────────────────────────────────────────  │
│  Total Amount                                 ₹500.00       │
│                                                             │
│  🛡️  Insurance Covered                      - ₹150.00       │
│  ─────────────────────────────────────────────────────────  │
│  You Pay                                      ₹350.00       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🎉 You're saving ₹150.00 with insurance!            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Flow Diagrams

### Complete Payment Flow
```
┌──────────────┐
│   User       │
│   Browses    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Add Items   │
│  to Cart     │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│         CHECKOUT PAGE                │
├──────────────────────────────────────┤
│  1. Shipping Address                 │
│  2. Select Payment Method            │
│     ├─ UPI                           │
│     ├─ Card                          │
│     ├─ NetBanking                    │
│     ├─ Wallet                        │
│     ├─ PayLater                      │
│     └─ Insurance (if available)      │
│  3. Review Order                     │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────┐
│  Has Insurance?      │
│  (User Decision)     │
└──┬───────────────┬───┘
   │ YES           │ NO
   ▼               ▼
┌──────────────┐  │
│  Select/     │  │
│  Upload      │  │
│  Policy      │  │
└──┬───────────┘  │
   │              │
   ▼              │
┌──────────────┐  │
│  Check       │  │
│  Coverage    │  │
│  (Backend)   │  │
└──┬───────────┘  │
   │              │
   └──────┬───────┘
          ▼
   ┌──────────────────┐
   │  Create Payment  │
   │  Order           │
   │  (Backend)       │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────────┐
   │  Calculate Amount    │
   │  - Subtotal          │
   │  - Insurance (if any)│
   │  = User Payable      │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │  Initialize          │
   │  Razorpay Checkout   │
   │  (Frontend)          │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │  User Completes      │
   │  Payment on          │
   │  Razorpay            │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │  Payment Success     │
   │  Callback            │
   └──────┬───────────────┘
          │
          ├─────────────────────────┐
          │                         │
          ▼                         ▼
   ┌──────────────┐        ┌──────────────┐
   │  Verify      │        │  Webhook     │
   │  Payment     │        │  Triggered   │
   │  (Frontend)  │        │  (Backend)   │
   └──────┬───────┘        └──────┬───────┘
          │                       │
          └───────┬───────────────┘
                  ▼
          ┌──────────────────┐
          │  Verify          │
          │  Signature       │
          │  (Backend)       │
          └──────┬───────────┘
                 │
                 ▼
          ┌──────────────────┐
          │  Update Payment  │
          │  Status          │
          │  (Database)      │
          └──────┬───────────┘
                 │
                 ▼
          ┌──────────────────┐
          │  Update Order    │
          │  Status          │
          └──────┬───────────┘
                 │
                 ▼
          ┌──────────────────┐
          │  Send            │
          │  Confirmation    │
          │  Email/SMS       │
          └──────┬───────────┘
                 │
                 ▼
          ┌──────────────────┐
          │  Redirect to     │
          │  Success Page    │
          └──────────────────┘
```

### Insurance Verification Flow
```
┌─────────────────┐
│  User Uploads   │
│  Policy         │
│  Document       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Frontend Validation    │
│  - File type (PDF/IMG)  │
│  - File size (< 5MB)    │
└────────┬────────────────┘
         │ ✓ Valid
         ▼
┌─────────────────────────┐
│  Upload to Storage      │
│  (S3/Cloud)             │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Create Insurance       │
│  Record (Backend)       │
│  Status: PENDING        │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Notify User            │
│  "Under Verification"   │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Admin Dashboard        │
│  - View Policy Details  │
│  - Review Document      │
│  - Check Provider DB    │
└────────┬────────────────┘
         │
         ├──────────────┬──────────────┐
         │ APPROVED     │ REJECTED     │
         ▼              ▼              │
┌────────────────┐ ┌────────────────┐ │
│  Update Status │ │  Update Status │ │
│  Set Coverage  │ │  Add Reason    │ │
│  Set Dates     │ │                │ │
└────────┬───────┘ └────────┬───────┘ │
         │                  │         │
         └────────┬─────────┘         │
                  ▼                   │
         ┌────────────────┐           │
         │  Notify User   │           │
         │  via Email/SMS │           │
         └────────┬───────┘           │
                  │                   │
                  ▼                   ▼
         ┌────────────────┐  ┌────────────────┐
         │  Available at  │  │  User Can      │
         │  Checkout      │  │  Re-upload     │
         └────────────────┘  └────────────────┘
```

### Coverage Calculation Flow
```
┌─────────────────┐
│  User at        │
│  Checkout with  │
│  Items in Cart  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  User Selects           │
│  Insurance Policy       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Frontend: Check Coverage Button        │
│  POST /api/insurance/check-coverage/:id │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Backend: Validate Request              │
│  - Insurance exists?                    │
│  - Insurance approved?                  │
│  - Policy not expired?                  │
│  - Has remaining coverage?              │
└────────┬────────────────────────────────┘
         │ ✓ Valid
         ▼
┌─────────────────────────────────────────┐
│  For Each Item in Cart:                 │
│                                          │
│  Item Type: MEDICINE                    │
│  ├─ Coverage: 30%                       │
│  ├─ Original: ₹500                      │
│  ├─ Covered: ₹150                       │
│  └─ User Pays: ₹350                     │
│                                          │
│  Item Type: LAB TEST                    │
│  ├─ Coverage: 20%                       │
│  ├─ Original: ₹1000                     │
│  ├─ Covered: ₹200                       │
│  └─ User Pays: ₹800                     │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Calculate Totals:                      │
│  ─────────────────────────────────────  │
│  Total Cart Value:        ₹1,500        │
│  Insurance Covered:      - ₹350         │
│  Delivery:               + ₹50          │
│  ─────────────────────────────────────  │
│  User Payable:            ₹1,200        │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Update Insurance Record:               │
│  - Add to coveredItems[]                │
│  - Update usedCoverage                  │
│  - Update remainingCoverage             │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Return to Frontend:                    │
│  {                                       │
│    success: true,                        │
│    totalOriginalAmount: 1500,            │
│    totalCoveredAmount: 350,              │
│    userPayableAmount: 1200,              │
│    remainingCoverage: 9650,              │
│    coveredItems: [...]                   │
│  }                                       │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Frontend: Update UI                    │
│  - Show savings badge                   │
│  - Update payment breakdown             │
│  - Enable "Proceed to Pay" button       │
└─────────────────────────────────────────┘
```

## 🗂️ Database Schema Visualization

### Payment Table
```
┌─────────────────────────────────────────────────────┐
│  payments                                           │
├─────────────────────────────────────────────────────┤
│  _id                    ObjectId     PRIMARY KEY    │
│  orderId                String       INDEXED        │
│  userId                 ObjectId     INDEXED, FK    │
│  gatewayOrderId         String       REQUIRED       │
│  transactionId          String       INDEXED        │
│  paymentMethod          Enum         REQUIRED       │
│  │  ├─ upi                                          │
│  │  ├─ card                                         │
│  │  ├─ netbanking                                   │
│  │  ├─ wallet                                       │
│  │  ├─ paylater                                     │
│  │  └─ insurance                                    │
│  paymentGateway         Enum         REQUIRED       │
│  │  ├─ razorpay                                     │
│  │  └─ paytm                                        │
│  paymentStatus          Enum         INDEXED        │
│  │  ├─ pending                                      │
│  │  ├─ success                                      │
│  │  ├─ failed                                       │
│  │  └─ refunded                                     │
│  amount                 Number       REQUIRED       │
│  currency               String       DEFAULT: INR   │
│  insuranceUsed          Boolean      DEFAULT: false │
│  insuranceId            ObjectId     OPTIONAL, FK   │
│  insuranceCoveredAmount Number       DEFAULT: 0     │
│  userPayableAmount      Number       REQUIRED       │
│  gatewayResponse        Object       OPTIONAL       │
│  webhookData            Object       OPTIONAL       │
│  failureReason          String       OPTIONAL       │
│  createdAt              Date         AUTO           │
│  updatedAt              Date         AUTO           │
└─────────────────────────────────────────────────────┘
```

### Insurance Table
```
┌─────────────────────────────────────────────────────┐
│  insurances                                         │
├─────────────────────────────────────────────────────┤
│  _id                  ObjectId     PRIMARY KEY      │
│  userId               ObjectId     INDEXED, FK      │
│  provider             String       REQUIRED         │
│  providerCode         Enum         REQUIRED         │
│  │  ├─ POLICYBAZAAR                                 │
│  │  ├─ MEDIASSIST                                   │
│  │  ├─ FHPL                                         │
│  │  └─ STARHEALTH                                   │
│  policyNumber         String       UNIQUE, INDEXED  │
│  policyDocumentUrl    String       REQUIRED         │
│  policyDocumentType   Enum         REQUIRED         │
│  │  ├─ pdf                                          │
│  │  └─ image                                        │
│  verificationStatus   Enum         INDEXED          │
│  │  ├─ pending                                      │
│  │  ├─ approved                                     │
│  │  ├─ rejected                                     │
│  │  └─ expired                                      │
│  verifiedBy           ObjectId     OPTIONAL, FK     │
│  rejectionReason      String       OPTIONAL         │
│  coveredItems         Array        DEFAULT: []      │
│  │  └─ {                                            │
│  │      itemId: String                              │
│  │      itemType: Enum [medicine, lab]              │
│  │      itemName: String                            │
│  │      originalPrice: Number                       │
│  │      coveredAmount: Number                       │
│  │      coPayPercentage: Number                     │
│  │    }                                             │
│  totalCoverageLimit   Number       DEFAULT: 0       │
│  usedCoverage         Number       DEFAULT: 0       │
│  remainingCoverage    Number       CALCULATED       │
│  policyStartDate      Date         OPTIONAL         │
│  policyEndDate        Date         OPTIONAL         │
│  isActive             Boolean      DEFAULT: true    │
│  createdAt            Date         AUTO             │
│  updatedAt            Date         AUTO             │
└─────────────────────────────────────────────────────┘
```

## 🔐 Security Architecture

### Payment Security Layers
```
┌─────────────────────────────────────────────────────┐
│  Layer 1: Frontend                                  │
│  ─────────────────────────────────────────────────  │
│  • HTTPS only                                       │
│  • No sensitive data storage                       │
│  • JWT token in localStorage                       │
│  • Razorpay SDK (PCI compliant)                    │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  Layer 2: API Gateway                               │
│  ─────────────────────────────────────────────────  │
│  • JWT authentication                               │
│  • Rate limiting                                    │
│  • CORS validation                                  │
│  • Request validation                               │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  Layer 3: Backend Services                          │
│  ─────────────────────────────────────────────────  │
│  • Signature verification (crypto)                  │
│  • Webhook signature validation                    │
│  • User ownership checks                            │
│  • RBAC for admin functions                        │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  Layer 4: Database                                  │
│  ─────────────────────────────────────────────────  │
│  • Encrypted connections                            │
│  • No card data storage                             │
│  • Audit logs (timestamps)                          │
│  • Data sanitization                                │
└─────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  Layer 5: Payment Gateway (Razorpay)                │
│  ─────────────────────────────────────────────────  │
│  • PCI DSS Level 1 certified                        │
│  • 3D Secure authentication                         │
│  • Fraud detection                                  │
│  • Secure card vault                                │
└─────────────────────────────────────────────────────┘
```

## 📱 Responsive Design

### Mobile View
```
┌─────────────────────┐
│  ☰  MedsZop    🛒  │
├─────────────────────┤
│                     │
│  Payment Method     │
│                     │
│  ┌─────────────────┐│
│  │ 📱  UPI      ✓ ││
│  └─────────────────┘│
│  ┌─────────────────┐│
│  │ 💳  Card        ││
│  └─────────────────┘│
│  ┌─────────────────┐│
│  │ 🏦  NetBanking  ││
│  └─────────────────┘│
│                     │
│  ───────────────────│
│                     │
│  Summary            │
│  Total:    ₹500.00  │
│  Insurance: -₹150   │
│  You Pay:   ₹350    │
│                     │
│  ┌─────────────────┐│
│  │   Pay Now       ││
│  └─────────────────┘│
└─────────────────────┘
```

### Desktop View
```
┌───────────────────────────────────────────────────────────┐
│  MedsZop                        🛒 Cart    👤 Profile    │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────┐  ┌─────────────────────┐│
│  │  Payment Methods            │  │  Order Summary      ││
│  │  ─────────────────────────  │  │  ─────────────────  ││
│  │  ┌──────┐ ┌──────┐ ┌──────┐│  │  Subtotal: ₹500.00  ││
│  │  │ 📱   │ │ 💳   │ │ 🏦   ││  │  Delivery:  ₹50.00  ││
│  │  │ UPI  │ │ Card │ │ Net  ││  │  ──────────────────  ││
│  │  └───✓──┘ └──────┘ └──────┘│  │  Total:    ₹550.00  ││
│  │  ┌──────┐ ┌──────┐ ┌──────┐│  │                     ││
│  │  │ 👛   │ │ ⏰   │ │ 🛡️   ││  │  🛡️ Insurance:      ││
│  │  │Wallet│ │PayLtr│ │Insur ││  │     -₹150.00        ││
│  │  └──────┘ └──────┘ └──────┘│  │  ──────────────────  ││
│  └─────────────────────────────┘  │  You Pay:  ₹400.00  ││
│                                   │                     ││
│                                   │  ┌─────────────────┐││
│                                   │  │   Proceed       │││
│                                   │  └─────────────────┘││
│                                   └─────────────────────┘│
└───────────────────────────────────────────────────────────┘
```

## 🎯 Component Integration Map

```
Checkout.tsx
    │
    ├──> PaymentMethodSelector.tsx
    │        │
    │        └──> State: selectedMethod
    │
    ├──> InsuranceUpload.tsx (conditional)
    │        │
    │        └──> Service: insuranceService.uploadPolicy()
    │
    ├──> PaymentBreakdown.tsx
    │        │
    │        └──> Props: {subtotal, insuranceCovered, total, userPayable}
    │
    └──> RazorpayCheckout.tsx (modal)
             │
             ├──> Service: paymentService.createOrder()
             ├──> Razorpay SDK: checkout.js
             ├──> Service: paymentService.verifyPayment()
             └──> Callbacks: {onSuccess, onFailure, onCancel}
```

---

## 🚀 Quick Reference Guide

### Component Import Paths
```typescript
// Payment Components
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';
import InsuranceUpload from '@/components/payment/InsuranceUpload';
import PaymentBreakdown from '@/components/payment/PaymentBreakdown';
import RazorpayCheckout from '@/components/payment/RazorpayCheckout';

// Services
import paymentService from '@/services/paymentService';
import insuranceService from '@/services/insuranceService';
```

### API Endpoints Quick List
```
Payment:
POST   /api/payments/create-order
POST   /api/payments/verify
POST   /api/payments/webhook
GET    /api/payments/order/:orderId
GET    /api/payments/user

Insurance:
POST   /api/insurance/upload
POST   /api/insurance/verify/:id (Admin)
POST   /api/insurance/check-coverage/:id
GET    /api/insurance/user
GET    /api/insurance/:id
GET    /api/insurance/pending (Admin)
PUT    /api/insurance/deactivate/:id
```

---

**This visual guide complements:**
- `PAYMENT_SYSTEM_GUIDE.md` - Detailed technical documentation
- `PAYMENT_QUICKSTART.md` - Quick setup guide
- `PAYMENT_IMPLEMENTATION_COMPLETE.md` - Implementation summary

**Use this guide for:**
- Understanding UI layout
- Visualizing data flow
- Planning integration
- Training new developers
- Client presentations

---

**Created:** 2024  
**Version:** 1.0.0  
**Maintained By:** MedsZop Development Team
