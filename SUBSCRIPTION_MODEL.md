# 4️⃣ Subscription Model for MedsZop

## Overview

MedsZop offers two comprehensive subscription plans designed to support chronic patients and ensure sustainable recurring revenue while improving user loyalty and retention.

---

## 1. Regular Subscription Model

### What is it?

A subscription plan where users subscribe to predefined monthly medicine packs and receive medicines automatically every month without needing to place individual orders.

### Example Plans

**Monthly Diabetes Pack (₹299/month)**
- Metformin 500mg (60 tablets)
- Glucometer strips (100 strips)
- Vitamin B-complex supplements
- Auto-delivery every 1st of the month

**BP Essentials Kit (₹349/month)**
- Amlodipine 5mg (30 tablets)
- Atenolol 50mg (30 tablets)
- BP monitor strips
- Automatic renewal on the 1st

**Senior Care Pack (₹399/month)**
- Multivitamins (30 tablets)
- Calcium supplements (60 tablets)
- General wellness kit
- Personalized delivery scheduling

### Key Benefits

✅ **For Users:**
- Saves time (no repeat ordering)
- Never run out of essential medicines
- Best for chronic illness management
- Predictable monthly expense
- Can pause/skip/modify anytime

✅ **For Business:**
- Predictable recurring revenue
- Improved customer retention (50%+ higher)
- Lower acquisition cost per transaction
- Better inventory management
- Reduces cart abandonment

---

## 2. Premium Subscription Model

### What is it?

Everything from Regular Subscription PLUS free/discounted doctor consultations and priority healthcare support. Designed for serious chronic and elderly patients.

### Example Plans

**Diabetes Care Plus (₹899/month)**
- Monthly diabetes medicine pack
- 1 free doctor consultation/month
- Free prescription review by pharmacist
- Priority delivery
- Health reminders & tips

**Heart Care Premium (₹999/month)**
- BP + cholesterol medications
- Monthly cardiologist consultation (chat/video)
- ECG report analysis
- Health tracking dashboard
- 24/7 support

**Senior Complete Care (₹1299/month)**
- Customizable senior care pack
- 2 free doctor consultations/month
- Prescription review & optimization
- Medication reminders via SMS/WhatsApp
- Dedicated customer support

### Key Benefits

✅ **For Users:**
- Complete healthcare solution
- Expert consultation included
- Priority support & faster delivery
- Prescription optimization
- Holistic health management

✅ **For Business:**
- 3-4x higher revenue per user
- Better differentiation vs competitors
- Trust & long-term loyalty
- Data for health insights
- Upsell opportunity

---

## Technical Implementation

### Backend Architecture

```
Backend/
├── models/
│   └── Subscription.ts
│       ├── SubscriptionPlan (admin-defined plans)
│       ├── Subscription (user subscriptions)
│       └── DoctorConsultation (premium feature)
├── controllers/
│   └── subscriptionController.ts
│       ├── Plan Management
│       ├── Subscription Lifecycle
│       ├── Doctor Consultations
│       └── Billing Cron Jobs
├── routes/
│   ├── subscription.routes.ts (API endpoints)
│   └── consultation.routes.ts (doctor consultation endpoints)
└── services/
    └── ocrService.ts (prescription processing)
```

### API Endpoints

#### Subscription Plans
```
GET  /api/subscription/plans              → Get all active plans
POST /api/subscription/plans              → Create new plan (admin)
```

#### User Subscriptions
```
GET    /api/subscription/user/:userId     → Get active subscription
POST   /api/subscription/create           → Create subscription
PUT    /api/subscription/:id/medicines    → Update medicines
PUT    /api/subscription/:id/pause        → Pause subscription
PUT    /api/subscription/:id/resume       → Resume subscription
PUT    /api/subscription/:id/skip-month   → Skip this month
PUT    /api/subscription/:id/cancel       → Cancel subscription
```

#### Doctor Consultations
```
POST   /api/consultation/create           → Book consultation
GET    /api/consultation/user/:userId     → Get user's consultations
PUT    /api/consultation/:id/complete     → Mark as completed
PUT    /api/consultation/:id/cancel       → Cancel consultation
```

#### Cron Jobs
```
POST /api/subscription/cron/process-billings → Run billing cycle (call daily via cron)
```

### Data Model

#### SubscriptionPlan
```typescript
{
  _id: ObjectId
  name: string                      // "Diabetes Care Plus"
  type: 'regular' | 'premium'
  description: string
  price: number                     // Monthly price in rupees
  medicines: string[]               // List of medicine names
  doctorConsultsPerMonth: number    // 0 for regular, 1-2 for premium
  features: string[]                // ["Auto-delivery", "Priority support"]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

#### Subscription
```typescript
{
  _id: ObjectId
  userId: ObjectId (ref: User)
  planId: ObjectId (ref: SubscriptionPlan)
  planType: 'regular' | 'premium'
  medicines: [
    {
      medicineId: string
      name: string
      quantity: number
    }
  ]
  status: 'active' | 'paused' | 'cancelled'
  startDate: Date
  nextBillingDate: Date
  billingCycleDay: number           // Day of month (1-31)
  totalAmount: number
  autoPaymentEnabled: boolean
  paymentMethodId: string
  doctorConsultsLeft: number        // Total per month
  doctorConsultsUsed: number        // Used this month
  skippedMonths: Date[]
  pausedUntil: Date (optional)
  cancelledAt: Date (optional)
  cancellationReason: string (optional)
  notificationsSent: boolean
  createdAt: Date
  updatedAt: Date
}
```

#### DoctorConsultation
```typescript
{
  _id: ObjectId
  subscriptionId: ObjectId (ref: Subscription)
  userId: ObjectId (ref: User)
  doctorId: ObjectId (ref: Doctor, optional)
  consultationType: 'chat' | 'video' | 'text'
  reason: string
  prescription: string (optional)
  status: 'scheduled' | 'completed' | 'cancelled'
  scheduledDate: Date
  completedAt: Date (optional)
  notes: string (optional)
  attachments: string[] (optional)
  createdAt: Date
  updatedAt: Date
}
```

---

## Payment Integration

### Razorpay Subscription API

**Setup:**
```typescript
// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create subscription
const subscription = await razorpay.subscriptions.create({
  plan_id: planId,
  customer_notify: 1,
  quantity: 1,
  total_count: 0  // Infinite
});
```

**Supported Payment Methods:**
- UPI AutoPay
- Cards (Visa, Mastercard, Amex)
- Netbanking

**Key Features:**
- Auto-debit on scheduled date
- Failure retry logic
- Email notifications
- One-click pause/resume

---

## Automated Billing & Order Creation

### Cron Job: Daily Billing Process

```typescript
// Runs daily at 2 AM
Every 24 hours:
  1. Find all subscriptions with nextBillingDate <= today
  2. For each subscription:
     a. Charge Razorpay subscription
     b. If payment succeeds:
        - Create automatic order
        - Find nearest pharmacy
        - Assign order to pharmacy
        - Send confirmation to user
     c. Move nextBillingDate to next month
     d. Reset doctorConsultsUsed to 0
     e. Send SMS/Email notification
```

### Notification Timeline

**3 days before billing:**
```
📧 Email & 💬 SMS:
"Your Diabetes Care Plus subscription will be charged ₹899 on Jan 15"
```

**On successful payment:**
```
✅ "Payment successful! Your medicines will be delivered by Jan 18"
📦 Order #MZ123456 created
```

**Before dispatch:**
```
📦 "Your order will be picked up shortly from Mediq Pharmacy"
📍 Pharmacy location & contact
```

---

## Frontend Components

### 1. SubscriptionPlans.tsx
- Display all subscription plans
- Plan comparison table
- Features highlight
- Subscribe button
- Current subscription status

### 2. SubscriptionManager.tsx
- View active subscription
- Update medicines
- Pause/Resume subscription
- Skip months
- Cancel subscription (with feedback)
- View next billing date

### 3. DoctorConsultation.tsx (Premium only)
- View consultation quota
- Book new consultation
- Select consultation type (chat/video/text)
- View upcoming appointments
- View consultation history
- Cancel consultation

### 4. HomePage Integration
- Add "Subscribe" CTA button
- Add "Doctor Consultation" CTA
- Premium badge for users
- Quick access links

---

## User Journey

### For Regular Subscriber

```
1. Browse Plans
   ↓
2. Select Regular Plan (₹299-499)
   ↓
3. Choose medicines & quantity
   ↓
4. Add payment method
   ↓
5. Confirm subscription
   ↓
6. Receive every month automatically
   ↓
7. Can pause/skip/modify anytime
```

### For Premium Subscriber

```
1. Browse Plans
   ↓
2. Select Premium Plan (₹799-1299)
   ↓
3. Choose medicines
   ↓
4. Add payment method
   ↓
5. Confirm subscription
   ↓
6. Medicines delivered + 1 free consultation/month
   ↓
7. Book doctor consultation when needed
   ↓
8. Get prescription & health advice
```

---

## Business Metrics

### Pricing Strategy

| Plan | Regular | Premium |
|------|---------|---------|
| **Diabetes** | ₹299 | ₹899 |
| **BP Care** | ₹349 | ₹999 |
| **Senior** | ₹399 | ₹1,299 |

### Expected Revenue

```
500 Regular Subscribers × ₹350 × 12 = ₹21,00,000
300 Premium Subscribers × ₹1,000 × 12 = ₹36,00,000
Total Annual Revenue = ₹57,00,000
```

### Key KPIs

- **Subscription Conversion Rate:** Target 5-8% of app users
- **Churn Rate:** Keep < 3% monthly
- **LTV:** Regular ₹4,200 | Premium ₹12,000
- **CAC:** Regular ₹500 | Premium ₹1,500
- **Retention:** Target 90%+ at 6 months

---

## Compliance & Safety

### Legal Requirements

✅ **Data Protection:**
- User consent for auto-debit
- HIPAA-compliant prescription storage
- Encrypted doctor consultations
- GDPR-ready architecture

✅ **User Rights:**
- Cancel anytime without penalty
- Easy unsubscribe process
- Refund for unused months
- Data export option

✅ **Medical Standards:**
- Pharmacist verification
- Doctor credentials verification
- Prescription compliance
- Medicine interaction checks

### Safety Features

- Reminder before every auto-debit
- One-click pause/resume
- Failed payment notifications
- Consultation recording consent
- Prescription audit trail

---

## Migration Path

### Phase 1 (Week 1-2)
- Deploy backend models & APIs
- Set up Razorpay integration
- Create subscription cron jobs

### Phase 2 (Week 3)
- Build frontend components
- Integrate with HomePage
- User testing

### Phase 3 (Week 4)
- Go live with soft launch
- Monitor conversions
- Optimize based on data

### Phase 4 (Month 2)
- Onboard premium doctors
- Launch doctor consultation feature
- Full marketing push

---

## Testing Checklist

### Backend Tests
- [ ] Create subscription
- [ ] Update medicines
- [ ] Pause/Resume
- [ ] Skip month
- [ ] Cancel with reason
- [ ] Billing cron job
- [ ] Doctor consultation booking
- [ ] Consultation cancellation

### Frontend Tests
- [ ] View plans
- [ ] Subscribe to plan
- [ ] Update medicines
- [ ] Manage subscription
- [ ] Book consultation
- [ ] View history

### Integration Tests
- [ ] Payment flow
- [ ] Order creation
- [ ] Pharmacy assignment
- [ ] Notifications
- [ ] Billing cycle

---

## Future Enhancements

🚀 **V2 Features:**
- AI-powered medicine recommendations
- Doctor-prescribed subscription plans
- Lab test integration
- Insurance integration
- Group subscriptions for families
- Loyalty points & rewards
- Subscription gifting
- Medicine auto-refill suggestions

---

## Support & Troubleshooting

**Common Issues:**

1. **Payment Failed**
   - Retry with different payment method
   - Check card limits
   - Update card details

2. **Order Not Created**
   - Check if pharmacy is available
   - Verify address
   - Contact support

3. **Can't Book Consultation**
   - Check if premium subscriber
   - Verify consultation quota
   - Check date/time availability

---

## Contact & Support

**For Users:** support@medszop.com | WhatsApp: +91-XXXX-XXXX

**For Doctors:** doctors@medszop.com

**For Pharmacies:** pharmacy@medszop.com

---

**Last Updated:** January 14, 2026  
**Version:** 1.0  
**Status:** ✅ Ready for Implementation
