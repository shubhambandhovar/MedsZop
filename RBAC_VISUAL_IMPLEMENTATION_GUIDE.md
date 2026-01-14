# 🎯 MedsZop RBAC - Visual Implementation Guide

## 🖼️ User Journey Maps

### Journey 1: Customer Login & Shopping

```
START
  │
  ├─ Browser loads MedsZop
  │
  ├─ Shows LOGIN PAGE
  │  ┌────────────────────────────────────┐
  │  │ Three Role Buttons:                │
  │  │ [👤 Customer] [🏪 Pharmacy] [🔐 Admin]
  │  │                                    │
  │  │ CUSTOMER TAB (auto-selected)       │
  │  │ Email: [user@test.com]             │
  │  │ Pass:  [••••••••]                  │
  │  │ [LOGIN] [REGISTER]                 │
  │  │ [Demo Customer] Button             │
  │  └────────────────────────────────────┘
  │
  ├─ User enters credentials
  │
  ├─ System validates
  │
  ├─ ✅ Login Success
  │
  ├─ Store JWT + User in localStorage
  │
  ├─ Route to HOME PAGE
  │  ┌────────────────────────────────────┐
  │  │ 🏠 MedsZop Home                    │
  │  │ [🔍 Search] ... [🛒 Cart] [👤 Me] │
  │  │                                    │
  │  │ [💊 Medicines] [📤 Upload Rx]     │
  │  │ [🤖 Scan Rx] [👨‍⚕️ Doctor]          │
  │  │ [🔁 Subscriptions]                 │
  │  │                                    │
  │  │ FEATURED MEDICINES                 │
  │  │ [💊] [💊] [💊] [💊]                 │
  │  │                                    │
  │  └────────────────────────────────────┘
  │
  ├─ User browses, adds to cart
  │
  ├─ Clicks Checkout
  │  ├─ Select address
  │  ├─ Choose payment
  │  ├─ Place order
  │  └─ ✅ Order Confirmed
  │
  ├─ User logs out
  │  ├─ Clear JWT + User
  │  ├─ Clear cart
  │  └─ Return to LOGIN PAGE
  │
  └─ CYCLE COMPLETE

```

### Journey 2: Pharmacy Login & Order Management

```
START
  │
  ├─ Browser loads MedsZop
  │
  ├─ Shows LOGIN PAGE
  │  ┌────────────────────────────────────┐
  │  │ Three Role Buttons:                │
  │  │ [👤 Customer] [🏪 Pharmacy] [🔐 Admin]
  │  │                                    │
  │  │ PHARMACY TAB (selected)            │
  │  │ Email: [pharmacy@healthplus.com]   │
  │  │ Pass:  [••••••••]                  │
  │  │ [LOGIN]                            │
  │  │ Demo: pharmacy@healthplus.com      │
  │  │ Password: pharmacy123              │
  │  │ [Demo Pharmacy] Button             │
  │  └────────────────────────────────────┘
  │
  ├─ User enters credentials
  │
  ├─ System validates (role: 'pharmacy')
  │
  ├─ ✅ Login Success
  │
  ├─ Store JWT + Pharmacy User
  │
  ├─ Route to PHARMACY DASHBOARD
  │  ┌────────────────────────────────────┐
  │  │ HealthPlus Pharmacy  [LOGOUT]      │
  │  │                                    │
  │  │ 📦 Pending: 5  🔄 Active: 12       │
  │  │                                    │
  │  │ [Orders] [Inventory] [Prescriptions]
  │  │                                    │
  │  │ PENDING ORDERS:                    │
  │  │ ✓ Order MZ001 (2.45pm deadline)   │
  │  │ ✓ Order MZ002 (3.00pm deadline)   │
  │  │ ✓ Order MZ003 (3.30pm deadline)   │
  │  │                                    │
  │  │ ACTIONS:                           │
  │  │ [✅ Accept] [❌ Reject]            │
  │  └────────────────────────────────────┘
  │
  ├─ Pharmacy manages orders
  │  ├─ Accept/reject orders
  │  ├─ View prescriptions
  │  ├─ Manage inventory
  │  └─ Check analytics
  │
  ├─ Pharmacy logs out
  │  ├─ Clear session
  │  └─ Return to LOGIN PAGE
  │
  └─ CYCLE COMPLETE

```

### Journey 3: Admin Login & Platform Management

```
START
  │
  ├─ Browser loads MedsZop
  │
  ├─ Shows LOGIN PAGE
  │  ┌────────────────────────────────────┐
  │  │ Three Role Buttons:                │
  │  │ [👤 Customer] [🏪 Pharmacy] [🔐 Admin]
  │  │                                    │
  │  │ ADMIN TAB (selected)               │
  │  │ Email: [admin@medszop.com]         │
  │  │ Pass:  [••••••••]                  │
  │  │ [LOGIN]                            │
  │  │ Demo: admin@medszop.com / admin123 │
  │  │ ⚠️  Admin Access Only               │
  │  │ [Demo Admin] Button                │
  │  └────────────────────────────────────┘
  │
  ├─ User enters credentials
  │
  ├─ System validates (role: 'admin')
  │
  ├─ ✅ Login Success
  │
  ├─ Store JWT + Admin User
  │
  ├─ Route to ADMIN DASHBOARD
  │  ┌────────────────────────────────────┐
  │  │ MedsZop Admin Panel  [LOGOUT]      │
  │  │                                    │
  │  │ PLATFORM STATS:                    │
  │  │ 👥 Users: 2,543                   │
  │  │ 🏪 Pharmacies: 156                │
  │  │ 📦 Orders Today: 890              │
  │  │ 💰 Revenue: ₹156,400              │
  │  │                                    │
  │  │ [Dashboard] [Users] [Pharmacies]  │
  │  │ [Orders] [Analytics] [Settings]   │
  │  │                                    │
  │  │ QUICK ACTIONS:                     │
  │  │ [View Orders] [Manage Users]       │
  │  │ [Check Analytics] [System Config]  │
  │  └────────────────────────────────────┘
  │
  ├─ Admin manages platform
  │  ├─ View analytics
  │  ├─ Manage users
  │  ├─ Manage pharmacies
  │  ├─ Monitor orders
  │  └─ Configure system
  │
  ├─ Admin logs out
  │  ├─ Clear session
  │  └─ Return to LOGIN PAGE
  │
  └─ CYCLE COMPLETE

```

---

## 🔐 Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    USER VISITS APP                       │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Check localStorage   │
              │ for JWT + user data  │
              └──────────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
    ┌──────────────┐        ┌──────────────┐
    │ Data exists? │        │   DATA       │
    │              │        │  NOT FOUND   │
    └──────────────┘        └──────────────┘
        │ YES                      │ NO
        ▼                          ▼
    ┌─────────────────┐    ┌──────────────────┐
    │ Set isLoggedIn  │    │  SHOW LOGIN PAGE │
    │ Set user role   │    │                  │
    │ Set viewMode    │    │ 3 Role Buttons:  │
    └─────────────────┘    │ 👤 🏪 🔐          │
        │                  └──────────────────┘
        ▼                           │
    ┌─────────────────┐            │
    │ ROUTE BY ROLE   │            │
    ├─────────────────┤            │
    │ user → /home    │            │
    │ pharmacy → /pharm-dash       │
    │ admin → /admin-dash          │
    └─────────────────┘            │
        │                          │
        │                  User selects role
        │                  & enters credentials
        │                          │
        │                          ▼
        │                  ┌──────────────────┐
        │                  │ POST /auth/login │
        │                  │ role: 'user'/'pharmacy'/'admin'
        │                  └──────────────────┘
        │                          │
        │                          ▼
        │                  ┌──────────────────┐
        │                  │ Validate creds   │
        │                  │ Check role match │
        │                  └──────────────────┘
        │                          │
        │           ┌──────────────┴──────────────┐
        │           │                             │
        │           ▼ ✅                          ▼ ❌
        │    ┌─────────────┐              ┌─────────────┐
        │    │ Return JWT  │              │ Return error│
        │    │ Return user │              │ Show toast  │
        │    └─────────────┘              │ Stay on login
        │           │                     └─────────────┘
        │           │
        │           ▼
        │    ┌─────────────────────┐
        │    │ Store JWT + user    │
        │    │ in localStorage     │
        │    └─────────────────────┘
        │           │
        └───────────┼───────────────┐
                    │               │
        ROUTE BY ROLE (Same as above)
        customer/pharmacy/admin dashboard
```

---

## 🎨 Color Scheme by Role

```
CUSTOMER          PHARMACY          ADMIN
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│             │   │             │   │             │
│   BLUE      │   │   GREEN     │   │  PURPLE     │
│   🔵        │   │   🟢        │   │  🟣        │
│             │   │             │   │             │
│ #003366     │   │ #009900     │   │ #663399     │
│             │   │             │   │             │
│ Trust       │   │ Growth      │   │ Security    │
│ Health      │   │ Partnership │   │ Control     │
│ Clean       │   │ Fresh       │   │ Professional│
│             │   │             │   │             │
└─────────────┘   └─────────────┘   └─────────────┘
```

---

## 📊 State Management

```
App State Structure
│
├─ isLoggedIn: boolean
│  └─ Controls login page visibility
│
├─ user: User
│  ├─ id: string
│  ├─ name: string
│  ├─ email: string
│  ├─ phone: string
│  ├─ role: 'user' | 'pharmacy' | 'admin'  ⭐ KEY FIELD
│  ├─ addresses: Address[]
│  ├─ orders: Order[]
│  └─ savedPrescriptions: Prescription[]
│
├─ viewMode: 'user' | 'pharmacy' | 'admin'
│  └─ Controls which dashboard to show
│
├─ currentView: ViewType
│  └─ Controls specific page within dashboard
│
├─ language: 'en' | 'hi'
│  └─ UI language setting
│
└─ [other state for cart, orders, etc.]
```

---

## 🔄 Logout Flow

```
User clicks LOGOUT
        │
        ▼
authService.logout()
        │
        ├─ localStorage.removeItem('token')
        ├─ localStorage.removeItem('user')
        │
        ▼
setIsLoggedIn(false)
        │
        ▼
setCurrentView('login')
        │
        ▼
setViewMode('user')
        │
        ▼
setCartItems([])
        │
        ▼
Show LOGIN PAGE again

User can now login as different role
```

---

## 📱 Component Hierarchy

```
App
├─ Router Component
├─ Language Provider
│
├─ IF NOT LOGGED IN
│  └─ Login Component
│     ├─ Role Selection Buttons
│     ├─ Form Tabs
│     │  ├─ Customer Tab
│     │  ├─ Pharmacy Tab
│     │  └─ Admin Tab
│     ├─ Demo Buttons
│     └─ Security Info
│
├─ ELSE IF Role === 'admin'
│  └─ AdminDashboard
│     ├─ Header (with Logout)
│     ├─ Navigation Tabs
│     ├─ Analytics Section
│     ├─ User Management
│     ├─ Pharmacy Management
│     └─ Settings
│
├─ ELSE IF Role === 'pharmacy'
│  └─ PharmacyDashboard
│     ├─ Header (with Logout)
│     ├─ Stats Cards
│     ├─ Order Management
│     ├─ Inventory Management
│     ├─ Prescription Verification
│     └─ Analytics
│
└─ ELSE (Role === 'user')
   └─ CustomerApp
      ├─ Header
      ├─ Navigation
      ├─ HomePage
      │  ├─ Medicine List
      │  ├─ Action Buttons
      │  └─ Categories
      ├─ MedicineSearch
      ├─ MedicineDetail
      ├─ Cart
      ├─ Checkout
      ├─ OrderTracking
      ├─ UserProfile
      ├─ PrescriptionUpload
      ├─ PrescriptionScanner
      ├─ SubscriptionPlans
      ├─ DoctorConsultation
      └─ AIChatbot
```

---

## 🎯 Key Decision Points

### At Login
```
IF role === 'admin'
  → Show Admin Login Form
  → After login → AdminDashboard

ELSE IF role === 'pharmacy'
  → Show Pharmacy Login Form
  → After login → PharmacyDashboard

ELSE (role === 'user')
  → Show Customer Login Form
  → After login → HomePage
```

### At Route Protection
```
IF !isLoggedIn
  → Block all routes
  → Show Login Page

ELSE IF user.role !== expected_role
  → Prevent access to other role's features
  → Stay on current dashboard

ELSE
  → Allow access
  → Render appropriate component
```

### On Auto-Login
```
IF localStorage has JWT + user
  IF user.role === 'admin'
    → setViewMode('admin')
    
  ELSE IF user.role === 'pharmacy'
    → setViewMode('pharmacy')
    
  ELSE
    → setViewMode('user')
    → setCurrentView('home')
  
  → SET isLoggedIn = true

ELSE
  → Show Login Page
```

---

## ✅ Verification Points

### Login Page
- [ ] Three role buttons visible
- [ ] Can click to switch tabs
- [ ] Form changes based on role
- [ ] Demo credentials displayed
- [ ] Quick demo buttons work
- [ ] Password toggle works
- [ ] Bilingual text correct

### Authentication
- [ ] Valid credentials login successfully
- [ ] Invalid credentials show error
- [ ] JWT stored in localStorage
- [ ] User object stored with role
- [ ] Page redirects to correct dashboard

### Routing
- [ ] Customer → Home
- [ ] Pharmacy → Pharmacy Dashboard
- [ ] Admin → Admin Dashboard
- [ ] Cannot access other role's dashboard
- [ ] Logout returns to login
- [ ] Page refresh maintains login

### Session
- [ ] Auto-login on refresh with stored session
- [ ] Logout clears all data
- [ ] Can switch roles by logging out
- [ ] Session persists across page navigation

---

## 🚀 Performance Notes

```
Optimization Points:
├─ localStorage is instant (no network delay)
├─ Role check happens synchronously
├─ No unnecessary re-renders
├─ Only JWT stored (lightweight)
├─ Dashboard lazy-loads content
└─ Images are optimized for performance
```

---

**This completes the visual implementation guide for MedsZop RBAC System!**
