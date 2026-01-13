# 4️⃣ Subscription Model - Architecture & Flow Diagrams

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MedsZop Subscription System               │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐                  ┌──────────────────────────┐
│   Frontend App   │                  │    Backend API Server    │
├──────────────────┤                  ├──────────────────────────┤
│ React 18         │◄─────HTTP/REST──►│ Express.js + TypeScript  │
│ TypeScript       │                  │ (Port 5000)              │
│ Vite             │                  │                          │
│ Tailwind CSS     │                  ├──────────────────────────┤
│                  │                  │ Controllers:             │
│ Components:      │                  │ ✓ subscriptionController │
│ ✓ Subscription   │                  │                          │
│   Plans          │                  │ Routes:                  │
│ ✓ Subscription   │                  │ ✓ subscription.routes    │
│   Manager        │                  │ ✓ consultation.routes    │
│ ✓ Doctor         │                  │                          │
│   Consultation   │                  │ Models:                  │
│                  │                  │ ✓ SubscriptionPlan       │
│ Services:        │                  │ ✓ Subscription           │
│ ✓ subscription   │                  │ ✓ DoctorConsultation     │
│   Service        │                  │                          │
│                  │                  │ Middleware:              │
│ State:           │                  │ ✓ Auth verification      │
│ ✓ userSubscription                  │ ✓ CORS                   │
│ ✓ currentView    │                  │ ✓ Body parser            │
└──────────────────┘                  └──────────────────────────┘
                                                ▲
                                                │
                                                ▼
                          ┌─────────────────────────────┐
                          │   MongoDB Database          │
                          ├─────────────────────────────┤
                          │ Collections:                │
                          │ ✓ subscriptionplans         │
                          │ ✓ subscriptions             │
                          │ ✓ doctorconsultations       │
                          │ ✓ users                     │
                          │ ✓ medicines                 │
                          │ ✓ orders                    │
                          └─────────────────────────────┘
                                        ▲
                                        │
                          ┌─────────────────────────────┐
                          │  External Services (Future) │
                          ├─────────────────────────────┤
                          │ ✓ Razorpay (Payments)       │
                          │ ✓ Twilio (SMS)              │
                          │ ✓ SendGrid (Email)          │
                          │ ✓ Cron Jobs (Billing)       │
                          └─────────────────────────────┘
```

---

## 🔄 Subscription Lifecycle Flow

```
                          ┌─────────────────┐
                          │  User Browsing  │
                          │ Medicine Store  │
                          └────────┬────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │  Discover Subscription   │
                    │  Plans Section           │
                    └────────┬─────────────────┘
                             │
                             ▼
                    ┌──────────────────────────┐
                    │  View All Plans          │
                    │  - Regular (₹299-499)    │
                    │  - Premium (₹799-1299)   │
                    └────────┬─────────────────┘
                             │
                             ▼
                    ┌──────────────────────────┐
                    │  Compare Plans           │
                    │  - Features              │
                    │  - Price                 │
                    │  - Medicines             │
                    │  - Doctor Consultations  │
                    └────────┬─────────────────┘
                             │
                             ▼
                    ┌──────────────────────────┐
                    │  Select Plan             │
                    │  Choose Medicines        │
                    │  Select Quantity         │
                    └────────┬─────────────────┘
                             │
                             ▼
                    ┌──────────────────────────┐
                    │  Payment Method          │
                    │  - UPI AutoPay           │
                    │  - Card                  │
                    │  - Razorpay              │
                    └────────┬─────────────────┘
                             │
                             ▼
                    ┌──────────────────────────┐
                    │  Subscription Active     │
                    │  ✓ Next billing date set │
                    │  ✓ Confirmation sent     │
                    │  ✓ Auto-delivery ready   │
                    └────────┬─────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
    ┌────────┐         ┌────────┐         ┌────────┐
    │ Manage │         │Billing │         │Premium │
    └────┬───┘         └───┬────┘         └───┬────┘
         │                 │                   │
         ▼                 ▼                   ▼
    ┌────────────┐    ┌─────────────┐    ┌──────────────┐
    │ Pause      │    │ Auto-charge │    │ Book Doctor  │
    │ Resume     │    │ Create      │    │ Consultation │
    │ Skip Month │    │ Order       │    │              │
    │ Cancel     │    │ Notify      │    │ Get Prescrip │
    │ Update     │    │ Dispatch    │    │ Chat/Video   │
    └────────────┘    └─────────────┘    └──────────────┘
```

---

## 💳 Billing Cycle Flow

```
┌─────────────────────────────────────────────────────────┐
│           Daily Cron Job (2:00 AM)                      │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ Find subscriptions    │
        │ due for billing       │
        │ (nextBillingDate ≤    │
        │  today)               │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ Charge Razorpay       │
        │ subscription          │
        └───────────┬───────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
    ┌─────────┐         ┌──────────────┐
    │ Success │         │ Failed       │
    └────┬────┘         └──────────────┘
         │
         ▼
    ┌──────────────────────────┐
    │ Create Automatic Order   │
    │ - Add medicines          │
    │ - Set delivery address   │
    │ - Calculate amount       │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Find Nearest Pharmacy    │
    │ - Check availability     │
    │ - Check delivery range   │
    │ - Assign order           │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Send Notifications       │
    │ - SMS: Payment & Order   │
    │ - Email: Confirmation   │
    │ - Push: Order Assigned   │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Update Subscription      │
    │ - Next billing date +1m  │
    │ - Reset consultations    │
    │ - Mark processed         │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Daily Summary Email      │
    │ - Total processed        │
    │ - Revenue                │
    │ - Failures               │
    └──────────────────────────┘
```

---

## 👨‍⚕️ Premium Doctor Consultation Flow

```
┌────────────────────────────┐
│  Premium User View App     │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│  Subscription Manager      │
│  Shows:                    │
│  - Consultations Left: 1   │
│  - Used This Month: 0      │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│  Click "Book Consultation" │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  Book Dialog Opens             │
│  - Type: Chat/Video/Text       │
│  - Reason: (Text input)        │
│  - Date & Time: (Picker)       │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  Validation                    │
│  - Check consultation quota    │
│  - Verify premium status       │
│  - Check date valid            │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  Create Consultation Record    │
│  - Status: "scheduled"         │
│  - Linked to subscription      │
│  - Increment used count        │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  Send Confirmation             │
│  - Email with appointment time │
│  - SMS reminder                │
│  - Push notification           │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  On Appointment Date           │
│  - Send reminder 1 hour before │
│  - Open consultation window    │
│  - Connect user ↔ doctor      │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  During Consultation           │
│  - Chat/Video/Text session    │
│  - Doctor reviews symptoms    │
│  - Doctor may prescribe       │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  Complete Consultation         │
│  - Doctor adds notes           │
│  - Add prescription (optional) │
│  - Mark as completed           │
│  - Generate report             │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  Post-Consultation             │
│  - Send report to user         │
│  - Archive consultation        │
│  - Update health records       │
│  - Send follow-up reminder     │
└────────────────────────────────┘
```

---

## 📊 Database Schema Relationships

```
┌──────────────────────────┐
│    User Collection       │
├──────────────────────────┤
│ _id: ObjectId            │
│ name: string             │
│ email: string            │
│ phone: string            │
│ role: string             │
│ addresses: Array         │
│ orders: Array            │
└────────────┬─────────────┘
             │ 1:1 (can have)
             │
             ▼
┌──────────────────────────┐
│  Subscription Collection │
├──────────────────────────┤
│ _id: ObjectId            │
│ userId: ObjectId ─────┐  │
│ planId: ObjectId ──┐  │  │
│ status: string     │  │  │
│ medicines: Array   │  │  │
│ nextBillingDate    │  │  │
│ doctorConsults     │  │  │
└────────┬───────────┘  │  │
         │              │  │
         │ 1:Many       │  │
         │              │  │
         ▼              │  │
┌──────────────────────┐ │  │
│ DoctorConsultation   │ │  │
├──────────────────────┤ │  │
│ _id: ObjectId        │ │  │
│ subscriptionId ◄─────┘  │  │
│ userId: ObjectId ◄──────┘  │
│ consultationType     │  │
│ scheduledDate        │  │
│ status: string       │  │
└──────────────────────┘  │
                          │
         ┌────────────────┘
         │ N:1
         │
         ▼
┌──────────────────────────┐
│ SubscriptionPlan         │
├──────────────────────────┤
│ _id: ObjectId            │
│ name: string             │
│ type: string             │
│ price: number            │
│ medicines: Array         │
│ features: Array          │
│ doctorConsults: number   │
└──────────────────────────┘
```

---

## 🔐 Authentication & Authorization Flow

```
┌──────────────────────────┐
│  User Login              │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Generate JWT Token      │
│  - Token expires in 24h  │
│  - Include user role     │
│  - Include user ID       │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Store in localStorage   │
│  - authToken             │
│  - user data             │
│  - role                  │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  API Request             │
│  Authorization: Bearer   │
│  {token}                 │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Backend Middleware      │
│  - Verify token          │
│  - Extract user ID       │
│  - Check role            │
└────────┬─────────────────┘
         │
    ┌────┴────┐
    │          │
    ▼          ▼
┌─────────┐ ┌──────────┐
│ Valid   │ │ Invalid  │
└────┬────┘ └────┬─────┘
     │           │
     ▼           ▼
┌────────┐  ┌──────────┐
│ Allow  │  │ Reject   │
│ Access │  │ 401 Auth │
└────────┘  └──────────┘
```

---

## 📱 Component Hierarchy

```
┌────────────────────────────────────┐
│         App.tsx (Root)             │
│     - State Management             │
│     - View Router                  │
└────────────────┬───────────────────┘
                 │
    ┌────────────┴──────────────┐
    │                           │
    ▼                           ▼
┌─────────────────┐    ┌─────────────────────┐
│  SubscriptionP  │    │  SubscriptionM      │
│  lans.tsx       │    │  anager.tsx         │
├─────────────────┤    ├─────────────────────┤
│ - Header        │    │ - Header            │
│ - Plans Grid    │    │ - Status Alert      │
│ - Plan Card     │    │ - Sub Details       │
│ - Comparison    │    │ - Action Buttons    │
│ - Subscribe Btn │    │ - Cancel Dialog     │
└────────┬────────┘    └────────┬────────────┘
         │                      │
         └──────────┬───────────┘
                    │
                    ▼
         ┌────────────────────────┐
         │ DoctorConsultation.tsx │
         ├────────────────────────┤
         │ - Header               │
         │ - Quota Card           │
         │ - Book Dialog          │
         │ - Upcoming List        │
         │ - Completed List       │
         └────────────────────────┘
```

---

## 🔌 API Call Flow

```
Frontend Component
       │
       ▼
subscriptionService (API Layer)
       │
       ├─ buildHeaders() ──► Add Auth Token
       │
       ├─ fetch() ──► HTTP Request
       │
       └─ response.json() ──► Parse Response
       │
       ▼
Backend Route Handler
       │
       ├─ Authenticate Middleware
       │
       ├─ Validate Input
       │
       ├─ Business Logic (Controller)
       │
       ├─ Database Query (Model)
       │
       └─ Response
       │
       ▼
Frontend State Update
       │
       ├─ setUserSubscription()
       │
       ├─ toast notification
       │
       └─ UI Re-render
```

---

## 📊 Data Flow Diagram

```
User Action (Click Subscribe)
           │
           ▼
React Component State Update
  (currentView = 'subscription-plans')
           │
           ▼
SubscriptionPlans Component Renders
           │
           ▼
useEffect Fires
  → subscriptionService.getPlans()
           │
           ▼
Frontend API Layer
  → fetch('/api/subscription/plans')
           │
           ▼
Backend Route
  → /api/subscription/plans
           │
           ▼
Express Route Handler
  → getSubscriptionPlans()
           │
           ▼
Controller Function
  → SubscriptionPlan.find()
           │
           ▼
MongoDB Query
  → subscriptionplans collection
           │
           ▼
Database Response
  → [Plan1, Plan2, Plan3]
           │
           ▼
Backend Response JSON
           │
           ▼
Frontend Receives Response
           │
           ▼
State Update
  setPlans(data.plans)
           │
           ▼
Component Re-renders
  Plans display on UI
           │
           ▼
User Interaction
  Click on plan
           │
           ▼
Next Flow...
```

---

## 🎯 Error Handling Flow

```
API Request
       │
       ▼
┌─────────────────┐
│ Success?        │
└────────┬────────┘
         │
    ┌────┴────┐
    │          │
   Yes        No
    │          │
    ▼          ▼
┌──────┐  ┌──────────┐
│ 200  │  │ Error    │
│ OK   │  │ Status   │
└──┬───┘  └────┬─────┘
   │           │
   ▼           ▼
┌──────────┐ ┌──────────────┐
│Parse     │ │Check Error   │
│Response  │ │Code:         │
└────┬─────┘ ├──────────────┤
     │       │400: Bad Req  │
     │       │401: Auth     │
     │       │403: Forbidden│
     │       │404: Not Found│
     │       │500: Server   │
     │       └────┬─────────┘
     │            │
     ▼            ▼
┌────────┐  ┌──────────────┐
│Update  │  │Show Error    │
│State   │  │Toast/Alert   │
└────┬───┘  └────┬─────────┘
     │           │
     ▼           ▼
┌───────────────────────┐
│Log Error (for debug)  │
└───────────────────────┘
```

---

## 🚀 Deployment Architecture

```
┌───────────────────────────────────────────────┐
│              Production Environment           │
└───────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐
│ CDN (Cloudflare)      │ API Load     │
│ - Frontend Assets    │ Balancer     │
│ - Images             │              │
│ - CSS/JS             └──────┬───────┘
└──────────┬────────────────────┤
           │                    │
           │                    ▼
           │         ┌──────────────────┐
           │         │ Backend Servers  │
           │         │ (Node.js Express)│
           │         │ - Instance 1     │
           │         │ - Instance 2     │
           │         │ - Instance 3     │
           │         └────────┬─────────┘
           │                  │
           └──────────────┬───┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ Database Server  │
                 │ (MongoDB Atlas)  │
                 │ - Replicated     │
                 │ - Backed up      │
                 │ - Indexed        │
                 └──────────────────┘
```

---

**Architecture Documentation Created:** January 14, 2026  
**Total Diagrams:** 12  
**Pages:** 8+
