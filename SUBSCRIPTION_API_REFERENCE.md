# Subscription Model - API Reference & Testing Guide

## 🔌 API Base URL

```
Development: http://localhost:5000/api
Production: https://api.medszop.com/api
```

---

## 📋 Subscription Plans API

### Get All Plans

**Endpoint:** `GET /subscription/plans`

**Description:** Retrieve all active subscription plans

**Authentication:** None required

**Response:**
```json
{
  "success": true,
  "plans": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Diabetes Care Plus",
      "type": "premium",
      "description": "Monthly diabetes medicines with doctor consultation",
      "price": 899,
      "medicines": ["Metformin 500mg", "Glucometer strips"],
      "doctorConsultsPerMonth": 1,
      "features": ["Auto delivery", "Doctor consultation", "Priority support"],
      "isActive": true
    }
  ]
}
```

**cURL Command:**
```bash
curl -X GET http://localhost:5000/api/subscription/plans \
  -H "Content-Type: application/json"
```

---

### Create New Plan (Admin Only)

**Endpoint:** `POST /subscription/plans`

**Description:** Create a new subscription plan (Admin only)

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "name": "Senior Complete Care",
  "type": "premium",
  "description": "Comprehensive senior health package",
  "price": 1299,
  "medicines": ["Multivitamin", "Calcium", "Blood Pressure Monitor"],
  "doctorConsultsPerMonth": 2,
  "features": [
    "Auto delivery",
    "2 doctor consultations",
    "Prescription review",
    "24/7 support"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription plan created",
  "plan": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Senior Complete Care",
    "type": "premium",
    "price": 1299
  }
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:5000/api/subscription/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Senior Complete Care",
    "type": "premium",
    "description": "Comprehensive senior health package",
    "price": 1299,
    "medicines": ["Multivitamin", "Calcium"],
    "doctorConsultsPerMonth": 2,
    "features": ["Auto delivery", "Doctor consultation"]
  }'
```

---

## 👤 User Subscriptions API

### Get User Subscription

**Endpoint:** `GET /subscription/user/:userId`

**Description:** Get current active subscription for a user

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `userId` (string): User ID

**Response:**
```json
{
  "success": true,
  "subscription": {
    "_id": "607f1f77bcf86cd799439013",
    "userId": "507f1f77bcf86cd799439011",
    "planId": "507f1f77bcf86cd799439012",
    "planType": "premium",
    "medicines": [
      {
        "medicineId": "m1",
        "name": "Metformin 500mg",
        "quantity": 60
      }
    ],
    "status": "active",
    "totalAmount": 899,
    "nextBillingDate": "2026-02-14T00:00:00.000Z",
    "doctorConsultsLeft": 1,
    "doctorConsultsUsed": 0
  }
}
```

**cURL Command:**
```bash
curl -X GET http://localhost:5000/api/subscription/user/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Create Subscription

**Endpoint:** `POST /subscription/create`

**Description:** Create new subscription for a user

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "planId": "507f1f77bcf86cd799439012",
  "medicines": [
    {
      "medicineId": "m1",
      "name": "Metformin 500mg",
      "quantity": 60
    },
    {
      "medicineId": "m2",
      "name": "Glucometer strips",
      "quantity": 100
    }
  ],
  "paymentMethodId": "razorpay_pay_id_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "subscription": {
    "_id": "607f1f77bcf86cd799439013",
    "userId": "507f1f77bcf86cd799439011",
    "planType": "premium",
    "status": "active",
    "totalAmount": 899,
    "nextBillingDate": "2026-02-14T00:00:00.000Z"
  }
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:5000/api/subscription/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "planId": "507f1f77bcf86cd799439012",
    "medicines": [
      {
        "medicineId": "m1",
        "name": "Metformin 500mg",
        "quantity": 60
      }
    ]
  }'
```

---

### Update Subscription Medicines

**Endpoint:** `PUT /subscription/:subscriptionId/medicines`

**Description:** Update the medicines in a subscription

**Authentication:** Required

**Path Parameters:**
- `subscriptionId` (string): Subscription ID

**Request Body:**
```json
{
  "medicines": [
    {
      "medicineId": "m1",
      "name": "Metformin 500mg",
      "quantity": 90
    },
    {
      "medicineId": "m3",
      "name": "Aspirin",
      "quantity": 30
    }
  ]
}
```

**cURL Command:**
```bash
curl -X PUT http://localhost:5000/api/subscription/607f1f77bcf86cd799439013/medicines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "medicines": [
      {"medicineId": "m1", "name": "Metformin 500mg", "quantity": 90}
    ]
  }'
```

---

### Pause Subscription

**Endpoint:** `PUT /subscription/:subscriptionId/pause`

**Description:** Pause a subscription for a specified period

**Authentication:** Required

**Request Body:**
```json
{
  "pauseUntilDate": "2026-03-14T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription paused",
  "subscription": {
    "_id": "607f1f77bcf86cd799439013",
    "status": "paused",
    "pausedUntil": "2026-03-14T00:00:00.000Z"
  }
}
```

**cURL Command:**
```bash
curl -X PUT http://localhost:5000/api/subscription/607f1f77bcf86cd799439013/pause \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "pauseUntilDate": "2026-03-14T00:00:00.000Z"
  }'
```

---

### Resume Subscription

**Endpoint:** `PUT /subscription/:subscriptionId/resume`

**Description:** Resume a paused subscription

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Subscription resumed",
  "subscription": {
    "_id": "607f1f77bcf86cd799439013",
    "status": "active",
    "pausedUntil": null
  }
}
```

**cURL Command:**
```bash
curl -X PUT http://localhost:5000/api/subscription/607f1f77bcf86cd799439013/resume \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Skip Month

**Endpoint:** `PUT /subscription/:subscriptionId/skip-month`

**Description:** Skip next month's delivery

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Month skipped successfully",
  "subscription": {
    "_id": "607f1f77bcf86cd799439013",
    "nextBillingDate": "2026-03-14T00:00:00.000Z",
    "skippedMonths": ["2026-02-14T00:00:00.000Z"]
  }
}
```

**cURL Command:**
```bash
curl -X PUT http://localhost:5000/api/subscription/607f1f77bcf86cd799439013/skip-month \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Cancel Subscription

**Endpoint:** `PUT /subscription/:subscriptionId/cancel`

**Description:** Cancel a subscription with optional feedback

**Authentication:** Required

**Request Body:**
```json
{
  "reason": "Too expensive, will resubscribe later"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled",
  "subscription": {
    "_id": "607f1f77bcf86cd799439013",
    "status": "cancelled",
    "cancelledAt": "2026-01-14T10:30:00.000Z",
    "cancellationReason": "Too expensive, will resubscribe later"
  }
}
```

**cURL Command:**
```bash
curl -X PUT http://localhost:5000/api/subscription/607f1f77bcf86cd799439013/cancel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "reason": "Too expensive, will resubscribe later"
  }'
```

---

## 👨‍⚕️ Doctor Consultations API (Premium Only)

### Book Doctor Consultation

**Endpoint:** `POST /consultation/create`

**Description:** Book a new doctor consultation (Premium subscribers only)

**Authentication:** Required

**Request Body:**
```json
{
  "subscriptionId": "607f1f77bcf86cd799439013",
  "userId": "507f1f77bcf86cd799439011",
  "consultationType": "video",
  "reason": "Blood pressure check and medication review",
  "scheduledDate": "2026-01-20T14:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Doctor consultation scheduled",
  "consultation": {
    "_id": "707f1f77bcf86cd799439014",
    "subscriptionId": "607f1f77bcf86cd799439013",
    "userId": "507f1f77bcf86cd799439011",
    "consultationType": "video",
    "reason": "Blood pressure check and medication review",
    "status": "scheduled",
    "scheduledDate": "2026-01-20T14:00:00.000Z",
    "createdAt": "2026-01-14T10:30:00.000Z"
  }
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:5000/api/consultation/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "subscriptionId": "607f1f77bcf86cd799439013",
    "userId": "507f1f77bcf86cd799439011",
    "consultationType": "video",
    "reason": "Blood pressure check and medication review",
    "scheduledDate": "2026-01-20T14:00:00.000Z"
  }'
```

---

### Get User Consultations

**Endpoint:** `GET /consultation/user/:userId`

**Description:** Get all consultations for a user

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "consultations": [
    {
      "_id": "707f1f77bcf86cd799439014",
      "subscriptionId": "607f1f77bcf86cd799439013",
      "userId": "507f1f77bcf86cd799439011",
      "consultationType": "video",
      "reason": "Blood pressure check",
      "status": "scheduled",
      "scheduledDate": "2026-01-20T14:00:00.000Z"
    },
    {
      "_id": "707f1f77bcf86cd799439015",
      "subscriptionId": "607f1f77bcf86cd799439013",
      "userId": "507f1f77bcf86cd799439011",
      "consultationType": "chat",
      "reason": "Medication review",
      "status": "completed",
      "completedAt": "2026-01-13T15:30:00.000Z",
      "notes": "Increase Metformin dosage"
    }
  ]
}
```

**cURL Command:**
```bash
curl -X GET http://localhost:5000/api/consultation/user/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Complete Consultation

**Endpoint:** `PUT /consultation/:consultationId/complete`

**Description:** Mark consultation as completed with notes (Doctor only)

**Authentication:** Required

**Request Body:**
```json
{
  "notes": "Blood pressure is well controlled. Continue current medications.",
  "prescription": "Continue Metformin 500mg twice daily with food"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Consultation completed",
  "consultation": {
    "_id": "707f1f77bcf86cd799439014",
    "status": "completed",
    "completedAt": "2026-01-20T14:30:00.000Z",
    "notes": "Blood pressure is well controlled",
    "prescription": "Continue Metformin 500mg twice daily"
  }
}
```

**cURL Command:**
```bash
curl -X PUT http://localhost:5000/api/consultation/707f1f77bcf86cd799439014/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
  -d '{
    "notes": "Blood pressure is well controlled",
    "prescription": "Continue Metformin 500mg twice daily"
  }'
```

---

### Cancel Consultation

**Endpoint:** `PUT /consultation/:consultationId/cancel`

**Description:** Cancel a scheduled consultation

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Consultation cancelled",
  "consultation": {
    "_id": "707f1f77bcf86cd799439014",
    "status": "cancelled"
  }
}
```

**cURL Command:**
```bash
curl -X PUT http://localhost:5000/api/consultation/707f1f77bcf86cd799439014/cancel \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚙️ Cron Jobs API

### Process Billings

**Endpoint:** `POST /subscription/cron/process-billings`

**Description:** Run billing cycle (call via cron job daily)

**Authentication:** Optional (can secure with cron secret)

**Response:**
```json
{
  "success": true,
  "message": "Processed 42 subscriptions",
  "processedCount": 42
}
```

**cURL Command:**
```bash
# Run via cron job (Linux/Mac)
0 2 * * * curl -X POST http://localhost:5000/api/subscription/cron/process-billings

# Or manually for testing
curl -X POST http://localhost:5000/api/subscription/cron/process-billings \
  -H "Content-Type: application/json"
```

---

## 🔐 Error Responses

### Common Error Codes

**400 Bad Request**
```json
{
  "success": false,
  "message": "User already has an active subscription"
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "message": "Only premium subscribers can book doctor consultations"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Subscription not found"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Database connection failed"
}
```

---

## 📊 Postman Collection

Import this in Postman:

```json
{
  "info": {
    "name": "MedsZop Subscription API",
    "version": "1.0.0"
  },
  "item": [
    {
      "name": "Subscription Plans",
      "item": [
        {
          "name": "Get All Plans",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/subscription/plans"
          }
        }
      ]
    }
  ]
}
```

---

## 🧪 Test Cases

### Happy Path - Regular Subscription

1. Get Plans ✅
2. Create Subscription ✅
3. View Subscription ✅
4. Update Medicines ✅
5. Skip Month ✅
6. Cancel Subscription ✅

### Happy Path - Premium Subscription

1. Get Plans ✅
2. Create Premium Subscription ✅
3. Book Doctor Consultation ✅
4. View Consultations ✅
5. Complete Consultation ✅
6. View Updated Quota ✅

### Error Cases

1. Create subscription when already exists ❌
2. Book consultation when not premium ❌
3. Book consultation when quota exceeded ❌
4. Cancel non-existent subscription ❌
5. Invalid payment method ❌

---

**Last Updated:** January 14, 2026  
**API Version:** 1.0.0  
**Status:** ✅ Ready for Testing
