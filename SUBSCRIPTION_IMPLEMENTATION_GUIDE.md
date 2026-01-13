# Subscription Model - Implementation Guide

## 🎯 Quick Start

This guide walks you through implementing the Subscription Model for MedsZop with both Regular and Premium plans.

---

## 📦 Files Created

### Backend Files

**Models:**
- `Backend/src/models/Subscription.ts` - All subscription data models

**Controllers:**
- `Backend/src/controllers/subscriptionController.ts` - All subscription business logic

**Routes:**
- `Backend/src/routes/subscription.routes.ts` - Subscription API endpoints
- `Backend/src/routes/consultation.routes.ts` - Doctor consultation endpoints

### Frontend Files

**Services:**
- `Frontend/src/services/subscriptionService.ts` - API integration layer

**Components:**
- `Frontend/src/app/components/SubscriptionPlans.tsx` - Plan browsing & subscription
- `Frontend/src/app/components/SubscriptionManager.tsx` - Subscription management
- `Frontend/src/app/components/DoctorConsultation.tsx` - Doctor consultation UI

**Updates:**
- `Frontend/src/app/App.tsx` - Added subscription views & routing
- `Frontend/src/app/types.ts` - New view types for subscriptions
- `Backend/src/app.ts` - Registered new routes

---

## 🚀 Implementation Steps

### Step 1: Verify All Files are Created

```bash
# Check backend models
ls Backend/src/models/Subscription.ts

# Check controllers
ls Backend/src/controllers/subscriptionController.ts

# Check routes
ls Backend/src/routes/subscription.routes.ts
ls Backend/src/routes/consultation.routes.ts

# Check frontend services
ls Frontend/src/services/subscriptionService.ts

# Check frontend components
ls Frontend/src/app/components/SubscriptionPlans.tsx
ls Frontend/src/app/components/SubscriptionManager.tsx
ls Frontend/src/app/components/DoctorConsultation.tsx
```

### Step 2: Install Dependencies (if needed)

```bash
cd Backend
npm install --save mongoose express cors dotenv

cd ../Frontend
npm install sonner lucide-react
```

### Step 3: Test Backend APIs

**Start Backend:**
```bash
cd Backend
npm run dev
```

**Test Subscription Plans Endpoint:**
```bash
curl http://localhost:5000/api/subscription/plans
```

### Step 4: Create Initial Subscription Plans

**Using Admin Panel or Direct API Call:**

```bash
curl -X POST http://localhost:5000/api/subscription/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Diabetes Care Plus",
    "type": "premium",
    "description": "Monthly diabetes medicines with doctor consultation",
    "price": 899,
    "medicines": ["Metformin 500mg", "Glucometer strips", "Vitamin B-complex"],
    "doctorConsultsPerMonth": 1,
    "features": [
      "Auto delivery every month",
      "Free prescription review",
      "Priority support",
      "Doctor consultation"
    ]
  }'
```

### Step 5: Update HomePage to Add Subscription Links

Add these buttons to HomePage component:

```tsx
// In HomePage.tsx, add to action buttons
<Button
  onClick={() => onSubscriptionClick && onSubscriptionClick()}
  className="bg-purple-600 hover:bg-purple-700"
>
  💜 Subscribe & Save
</Button>

<Button
  onClick={() => onDoctorConsultationClick && onDoctorConsultationClick()}
  className="bg-blue-600 hover:bg-blue-700"
>
  👨‍⚕️ Doctor Consultation
</Button>
```

### Step 6: Update App.tsx Header Props

```tsx
// Add to Header component props
onSubscriptionClick={() => setCurrentView('subscription-plans')}
onDoctorConsultationClick={() => {
  if (userSubscription?.planType === 'premium') {
    setCurrentView('doctor-consultation');
  } else {
    toast.info('Doctor consultation is a premium feature');
    setCurrentView('subscription-plans');
  }
}}
```

### Step 7: Setup Razorpay Integration (Optional)

Create `Backend/src/services/razorpayService.ts`:

```typescript
import Razorpay from 'razorpay';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const createRazorpaySubscription = async (planId: string, customerId: string) => {
  // Create subscription in Razorpay
  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    customer_notify: 1,
    quantity: 1,
    total_count: 0, // Infinite
  });
  return subscription;
};

export const pauseRazorpaySubscription = async (subscriptionId: string) => {
  return await razorpay.subscriptions.pause(subscriptionId, {
    pause_at: 'now',
  });
};

export const resumeRazorpaySubscription = async (subscriptionId: string) => {
  return await razorpay.subscriptions.resume(subscriptionId, {
    resume_at: 'now',
  });
};
```

### Step 8: Setup Cron Job for Daily Billing

Create `Backend/src/jobs/billingCron.ts`:

```typescript
import cron from 'node-cron';
import { Subscription } from '../models/Subscription';
import { Order } from '../models/Order';

// Run every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('🕐 Running daily billing cron job...');
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find subscriptions due for billing
    const dueSubscriptions = await Subscription.find({
      status: 'active',
      nextBillingDate: { $lte: today },
    }).populate('userId planId');

    for (const subscription of dueSubscriptions) {
      // TODO: Charge Razorpay
      // TODO: Create order
      // TODO: Assign to pharmacy
      // TODO: Send notifications
      
      // Update next billing date
      const nextBilling = new Date(subscription.nextBillingDate);
      nextBilling.setMonth(nextBilling.getMonth() + 1);
      subscription.nextBillingDate = nextBilling;
      
      // Reset consultations
      subscription.doctorConsultsUsed = 0;
      
      await subscription.save();
    }

    console.log(`✅ Processed ${dueSubscriptions.length} subscriptions`);
  } catch (error) {
    console.error('❌ Billing cron error:', error);
  }
});

export default cron;
```

### Step 9: Test Frontend

**Start Frontend:**
```bash
cd Frontend
npm run dev
```

**Navigate to:** `http://localhost:5174`

**User Flow:**
1. Login as user
2. Click "Subscribe & Save" button
3. Browse plans
4. Select a plan
5. Complete subscription
6. View subscription details
7. If premium, book doctor consultation

---

## 🧪 Testing Scenarios

### Test 1: Create Subscription

```typescript
// In browser console
fetch('http://localhost:5000/api/subscription/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    userId: 'user123',
    planId: 'plan123',
    medicines: [
      { medicineId: 'm1', name: 'Metformin', quantity: 60 }
    ]
  })
}).then(r => r.json()).then(console.log);
```

### Test 2: Pause Subscription

```typescript
fetch('http://localhost:5000/api/subscription/SUB_ID/pause', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    pauseUntilDate: new Date(Date.now() + 30*24*60*60*1000) // 30 days
  })
}).then(r => r.json()).then(console.log);
```

### Test 3: Book Doctor Consultation

```typescript
fetch('http://localhost:5000/api/consultation/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    subscriptionId: 'sub123',
    userId: 'user123',
    consultationType: 'video',
    reason: 'Blood pressure check and medication review',
    scheduledDate: new Date(Date.now() + 7*24*60*60*1000)
  })
}).then(r => r.json()).then(console.log);
```

---

## 📊 Database Seeding

Add sample subscription plans to database:

```typescript
// Backend/src/seed.ts (add to existing seed file)

import { SubscriptionPlan } from './models/Subscription';

const seedSubscriptionPlans = async () => {
  const plans = [
    {
      name: 'Diabetes Monthly Pack',
      type: 'regular',
      description: 'Essential medicines for diabetes management',
      price: 299,
      medicines: ['Metformin 500mg', 'Glucometer strips', 'Vitamin B-complex'],
      doctorConsultsPerMonth: 0,
      features: ['Auto delivery', 'Easy to manage', 'Cost-effective']
    },
    {
      name: 'Diabetes Care Plus',
      type: 'premium',
      description: 'Diabetes management with doctor consultation',
      price: 899,
      medicines: ['Metformin 500mg', 'Glucometer strips', 'Vitamin B-complex'],
      doctorConsultsPerMonth: 1,
      features: [
        'Auto delivery',
        '1 doctor consultation/month',
        'Prescription review',
        'Priority support'
      ]
    },
    {
      name: 'BP Essentials Kit',
      type: 'regular',
      description: 'BP management essentials',
      price: 349,
      medicines: ['Amlodipine 5mg', 'Atenolol 50mg', 'BP strips'],
      doctorConsultsPerMonth: 0,
      features: ['Auto delivery', 'Monitor included', 'Easy refills']
    },
    {
      name: 'Heart Care Premium',
      type: 'premium',
      description: 'Complete heart health management',
      price: 999,
      medicines: ['Amlodipine 5mg', 'Atenolol 50mg', 'Aspirin', 'Statin'],
      doctorConsultsPerMonth: 2,
      features: [
        'Auto delivery',
        '2 cardiologist consultations/month',
        'ECG analysis',
        'Health tracking'
      ]
    }
  ];

  await SubscriptionPlan.insertMany(plans);
  console.log('✅ Subscription plans seeded');
};

// Run during app initialization
seedSubscriptionPlans();
```

---

## 🔄 Integration with Existing Features

### HomePage Integration

```tsx
// Add in HomePage component
import { SubscriptionPlans } from './components/SubscriptionPlans';

// Add button in hero section
<Button
  onClick={() => setCurrentView('subscription-plans')}
  className="bg-purple-600 hover:bg-purple-700"
  size="lg"
>
  💜 Subscribe & Never Reorder
</Button>
```

### UserProfile Integration

```tsx
// Add in UserProfile component
{userSubscription && (
  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
    <h3 className="font-semibold text-purple-900">Active Subscription</h3>
    <p>{userSubscription.planType} - ₹{userSubscription.totalAmount}/month</p>
    <Button onClick={() => setCurrentView('subscription-manager')}>
      Manage Subscription
    </Button>
  </div>
)}
```

### Cart Integration

```tsx
// Add in Cart component
<div className="bg-blue-50 p-4 rounded-lg">
  <p className="text-sm text-blue-900">
    💡 These items are available via subscription for ₹299/month
  </p>
  <Button onClick={() => setCurrentView('subscription-plans')}>
    View Plans
  </Button>
</div>
```

---

## 📝 Environment Variables

Add to `.env` in Backend:

```env
# Razorpay (Optional)
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Email Service (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# SMS Service (for notifications)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
```

---

## 🚨 Error Handling

All endpoints include proper error handling:

```typescript
// Error responses follow this format
{
  success: false,
  message: 'Error description',
  error?: 'Error details for debugging'
}

// Success responses
{
  success: true,
  message: 'Success message',
  data: { /* response data */ }
}
```

---

## 📱 Notifications Implementation

### SMS Notification (Example with Twilio)

```typescript
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendBillingReminder = async (phoneNumber: string, amount: number, date: Date) => {
  await client.messages.create({
    body: `Your MedsZop subscription of ₹${amount} will be charged on ${date.toLocaleDateString()}. Reply STOP to pause.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber
  });
};
```

### Email Notification

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

export const sendSubscriptionConfirmation = async (email: string, planName: string) => {
  await transporter.sendMail({
    to: email,
    subject: `Welcome to MedsZop Subscription - ${planName}`,
    html: `<h1>Subscription Confirmed!</h1><p>You are now subscribed to ${planName}</p>`
  });
};
```

---

## ✅ Deployment Checklist

- [ ] All files created and verified
- [ ] Backend routes registered in app.ts
- [ ] Frontend components imported in App.tsx
- [ ] TypeScript compilation errors resolved
- [ ] MongoDB connection verified
- [ ] Razorpay API keys configured (if using)
- [ ] Cron job scheduled
- [ ] Notification service configured
- [ ] Testing completed
- [ ] Documentation updated
- [ ] Git committed

---

## 🎓 Learning Resources

- [Razorpay Subscriptions API](https://razorpay.com/docs/api/subscriptions/)
- [Node-cron Documentation](https://github.com/kelektiv/node-cron)
- [Express.js Middleware](https://expressjs.com/en/guide/using-middleware.html)

---

## 📞 Support

For implementation issues, check:
1. Browser Console (Frontend errors)
2. Server Logs (Backend errors)
3. Network Tab (API response status)
4. MongoDB Atlas (Database connectivity)

---

**Created:** January 14, 2026  
**Status:** ✅ Ready for Testing
