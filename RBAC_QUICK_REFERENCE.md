# MedsZop RBAC - Quick Reference Card

## 🎯 Login Page - Three Roles

### Selection Screen
```
┌─────────────────────────────────────────────────────────┐
│                    Welcome to MedsZop                    │
│                 Medicine at your doorstep                │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │     👤       │  │      🏪      │  │      🔐      │  │
│  │  CUSTOMER    │  │   PHARMACY   │  │    ADMIN     │  │
│  │   Buy meds   │  │ Partner with │  │   Manage     │  │
│  │              │  │    us        │  │  platform    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                           │
│  [Demo Customer] [Demo Pharmacy] [Demo Admin]            │
└─────────────────────────────────────────────────────────┘
```

---

## 📱 Three Login Forms

### 1. Customer Login/Register
```
┌─ CUSTOMER ─────────────────────────┐
│ Email:           [user@test.com  ] │
│ Password:        [••••••••        ] │ 👁
│                                     │
│ [LOGIN BUTTON]                      │
│                                     │
│ Demo: user@test.com / password123   │
│                                     │
│ Or → [Register Tab] to signup       │
└─────────────────────────────────────┘
```

### 2. Pharmacy Login
```
┌─ PHARMACY ─────────────────────────┐
│ Email:    [pharmacy@healthplus.com]│
│ Password: [•••••••••••••••••••    ] │ 👁
│                                     │
│ [LOGIN BUTTON]                      │
│                                     │
│ Demo: pharmacy@healthplus.com       │
│       pharmacy123                   │
│                                     │
│ Contact us to register new pharmacy │
└─────────────────────────────────────┘
```

### 3. Admin Login
```
┌─ ADMIN ────────────────────────────┐
│ Email:    [admin@medszop.com      ]│
│ Password: [•••••••••••••••••••    ] │ 👁
│                                     │
│ [LOGIN BUTTON]                      │
│                                     │
│ Demo: admin@medszop.com / admin123  │
│                                     │
│ ⚠️  Access restricted to MedsZop    │
└─────────────────────────────────────┘
```

---

## 🔑 Credentials Quick Copy

### Customer
```
Email:    user@test.com
Password: password123
```

### Pharmacy
```
Email:    pharmacy@healthplus.com
Password: pharmacy123
```

### Admin
```
Email:    admin@medszop.com
Password: admin123
```

---

## 🎨 Color Scheme

| Role | Color | Icon | Theme |
|------|-------|------|-------|
| Customer | Blue 🔵 | 👤 | Health/Trust |
| Pharmacy | Green 🟢 | 🏪 | Growth/Partner |
| Admin | Purple 🟣 | 🔐 | Security/Control |

---

## 📍 After Login - Where You Go

### Customer
```
Login ✓
    ↓
HOME PAGE
    ├─ 🏠 Home (medicines list)
    ├─ 🔍 Search medicines
    ├─ 💊 Buy medicines
    ├─ 📤 Upload prescription
    ├─ 📦 Track orders
    ├─ 👨‍⚕️  Doctor consultation
    ├─ 🔁 Subscriptions
    ├─ 👤 Profile
    └─ 🚪 Logout → Back to LOGIN
```

### Pharmacy Partner
```
Login ✓
    ↓
PHARMACY DASHBOARD
    ├─ 📊 Analytics
    ├─ 📦 Manage orders
    ├─ 💊 Manage inventory
    ├─ 📄 Verify prescriptions
    ├─ 📈 Sales reports
    ├─ 👤 Pharmacy profile
    └─ 🚪 Logout → Back to LOGIN
```

### Admin
```
Login ✓
    ↓
ADMIN DASHBOARD
    ├─ 📊 Platform analytics
    ├─ 👥 Manage users
    ├─ 🏪 Manage pharmacies
    ├─ 📦 Monitor orders
    ├─ 💳 Subscription management
    ├─ ⚙️  System settings
    ├─ 📋 Compliance & audit
    └─ 🚪 Logout → Back to LOGIN
```

---

## ✨ Key Features

### ✅ Login System
- [x] Three role-based login tabs
- [x] Email + Password authentication
- [x] Demo credentials for quick testing
- [x] Password visibility toggle
- [x] Form validation with error messages
- [x] Bilingual support (EN/HI)

### ✅ Routing
- [x] Auto-login from localStorage
- [x] Role-based dashboard routing
- [x] Prevent unauthorized access
- [x] Logout clears session
- [x] Refresh maintains login state

### ✅ Security
- [x] JWT token storage
- [x] Role-based access control
- [x] Session timeout
- [x] Password encryption (future)
- [x] Audit logging (future)

### ✅ UX
- [x] Responsive design
- [x] Quick demo buttons
- [x] Clear visual hierarchy
- [x] Role color-coded
- [x] Error/success toasts

---

## 🚀 Quick Start for Demos

### Show Customer Features
```
1. Click "Demo Customer" button
2. Land on home page with medicines
3. Browse, search, add to cart
4. Upload prescriptions
5. Click Logout → Back to login
```

### Show Pharmacy Features
```
1. Click "Demo Pharmacy" button
2. See orders to fulfill
3. Manage inventory
4. Verify prescriptions
5. Check analytics
6. Click Logout → Back to login
```

### Show Admin Features
```
1. Click "Demo Admin" button
2. View platform analytics
3. Browse user management
4. Check order monitoring
5. See system settings
6. Click Logout → Back to login
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't see login | Clear localStorage, refresh page |
| Demo account doesn't work | Check email exactly matches (case-sensitive) |
| Can't switch roles | Logout first, then login as different role |
| Missing logout button | Check navbar or dashboard header |
| Bilingual text wrong | Check language toggle in header |

---

## 📚 Documentation

- **Full RBAC Docs:** `ROLE_BASED_ACCESS_CONTROL.md`
- **Implementation Details:** `RBAC_IMPLEMENTATION_SUMMARY.md`
- **Source Code:** `Frontend/src/app/components/Login.tsx`
- **Auth Service:** `Frontend/src/services/authService.ts`

---

## 🎓 Code Reference

### Check Current User Role
```typescript
import { authService } from '@/services/authService';

const userRole = authService.getUserRole();
// Returns: 'user' | 'pharmacy' | 'admin' | null
```

### Get Current User
```typescript
const user = authService.getCurrentUser();
// Returns: User object with role
```

### Check if Logged In
```typescript
const isLoggedIn = authService.isLoggedIn();
// Returns: true | false
```

### Login with Role
```typescript
const result = await authService.login(email, password, role);
// role: 'user' | 'pharmacy' | 'admin'
```

### Logout
```typescript
authService.logout();
```

---

**Ready to Demo! Try all three roles with the quick demo buttons.** 🎉
