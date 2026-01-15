# Create New Pharmacy User

## Method 1: Use Postman/Thunder Client

**POST** `http://localhost:5000/api/auth/register`

**Body (JSON):**
```json
{
  "name": "Your Pharmacy Name",
  "email": "yourpharmacy@example.com",
  "password": "YourPassword123",
  "phone": "+91 9876543210",
  "role": "pharmacy"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "Your Pharmacy Name",
      "email": "yourpharmacy@example.com",
      "role": "pharmacy"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## Method 2: Use PowerShell

```powershell
$body = @{
    name = "Your Pharmacy Name"
    email = "yourpharmacy@example.com"
    password = "YourPassword123"
    phone = "+91 9876543210"
    role = "pharmacy"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $body -ContentType "application/json"
```

---

## Method 3: Register on Frontend

1. Go to your MedsZop website
2. Go to Login page
3. Switch to "Pharmacy" tab
4. Click "Register" (if available)
5. Fill in details with role: "pharmacy"

---

## What You Get

After registration, you'll receive:
- ✅ Real JWT token
- ✅ User ID stored in MongoDB
- ✅ Can add medicines to MongoDB
- ✅ Medicines will sync across devices

---

## Already Created! ✅

You just ran `npm run seed` which created:

**Pharmacy:** pharmacy@test.com / password123

**Login now with these credentials to test!**
