# MedsZop - Role-Based Access Control (RBAC) System

## Overview

MedsZop implements a comprehensive role-based access control system with three distinct user roles:

1. **👤 Customer (User)** - Regular users who buy medicines
2. **🏪 Pharmacy Partner** - Pharmacies that fulfill orders
3. **🔐 Admin** - MedsZop team managing the platform

---

## 🟢 1. CUSTOMER (END USER)

### Who is this?
People who use MedsZop to:
- Buy medicines with 60-minute delivery
- Upload and scan prescriptions using AI
- Subscribe to monthly medicine packs
- Book doctor consultations
- Track orders in real-time

### Login Method
- **Email + Password** (for registration and login)
- Phone OTP (future enhancement)
- Google Sign-in (future enhancement)

### Demo Credentials
```
Email: user@test.com
Password: password123
```

### Features

#### 🏠 Home & Search
- Search medicines by name, category, or ingredient
- Browse medicine categories (BP, Diabetes, Cold, etc.)
- View delivery time (60 minutes standard)
- Filter by availability and ratings

#### 💊 Medicine Purchase
- View detailed medicine information
- Add medicines to cart
- Checkout with address selection
- Multiple payment methods (UPI, Card, Wallet)
- Order history and re-order functionality

#### 📤 Prescription Scanner (AI)
- Upload handwritten/printed prescriptions
- AI automatically scans and extracts medicines
- Suggest medicines available on platform
- Show substitutes if medicines unavailable
- Pharmacist verification status

#### 📦 Order Management
- Live order tracking with GPS
- Order status updates (confirmed → packed → out for delivery → delivered)
- Re-order medicines from previous orders
- Download invoices and bills

#### 🔔 Medicine Reminders
- Set daily medication reminders
- Chronic care support for long-term medicines
- Notification badges on mobile

#### 🔁 Subscriptions
- Regular subscription for monthly medicines
- Premium subscription (medicines + doctor consult)
- Pause, resume, or cancel anytime
- Automatic reorder on subscription dates

#### 👨‍⚕️ Doctor Consultation (Premium)
- Book appointments with verified doctors
- Chat/video consultations
- Digital prescription generation
- Prescription can be used to order medicines

#### 👤 Profile Management
- Saved addresses (home, work, other)
- Saved prescriptions for quick reorder
- Order and payment history
- Subscription management
- Account settings and logout

### Customer Dashboard Routes
```
/home                    - Home page with featured medicines
/medicines              - Search and browse medicines
/medicine/:id           - Medicine detail page
/cart                   - Shopping cart
/checkout               - Checkout process
/orders                 - Order history
/order/:id              - Order tracking
/upload-prescription    - Upload prescription
/prescription-scanner   - AI prescription scanner
/subscriptions          - Subscription plans
/subscription/:id       - Subscription manager
/doctor-consultation    - Doctor consultation booking
/profile                - User profile
```

---

## 🟡 2. PHARMACY PARTNER (SELLER)

### Who is this?
Local pharmacies registered with MedsZop to:
- Accept and fulfill orders from customers
- Verify prescription requirements
- Manage medicine inventory
- Suggest substitutes for unavailable medicines
- Track and manage delivery

### Login Method
- **Email + Password** (verified by admin before account creation)
- Role: `pharmacy`
- Account activation by MedsZop admin team

### Demo Credentials
```
Email: pharmacy@healthplus.com
Password: pharmacy123
```

### Features

#### 🏪 Pharmacy Dashboard
- Overview of all incoming orders
- Quick stats (pending, active, completed orders)
- Accept/reject orders based on availability
- View delivery deadline for each order
- Pharmacy ratings and performance metrics

#### 💊 Medicine Inventory Management
- Add new medicines to inventory
- Update price and stock quantity
- Mark medicines as out-of-stock
- Bulk inventory upload via CSV
- Set discounts and promotional offers
- Track medicine expiry dates

#### 📤 Prescription Verification
- View customer uploaded prescriptions
- Approve/reject based on pharmacy policies
- Suggest substitutes (same generic, different brand)
- Mark prescription as verified
- Communicate with customers about substitutes
- Compliance with regulatory requirements

#### 📦 Order Processing
- Accept/reject orders within time limit
- Update order status:
  - **confirmed** → received from customer
  - **packed** → medicines packed and ready
  - **ready_for_delivery** → ready for pickup
- Assign delivery partner (if applicable)
- Track fulfillment metrics

#### 📊 Pharmacy Analytics
- Daily/weekly/monthly order statistics
- Revenue and commission tracking
- Top-selling medicines
- Popular medicine categories
- Avg. order value and fulfillment time
- Customer ratings and reviews

#### 👤 Profile Management
- Pharmacy details (name, address, phone)
- License and registration documents
- Working hours configuration
- Delivery zones
- Bank account for commission payouts
- Logout

### Pharmacy Dashboard Routes
```
/pharmacy/dashboard           - Main pharmacy dashboard
/pharmacy/orders              - Order management
/pharmacy/orders/:id          - Order details
/pharmacy/inventory           - Manage medicines inventory
/pharmacy/inventory/add        - Add new medicine
/pharmacy/inventory/bulk       - Bulk upload medicines
/pharmacy/prescriptions       - Prescription verification
/pharmacy/prescriptions/:id   - Prescription details
/pharmacy/analytics           - Sales and performance analytics
/pharmacy/profile             - Pharmacy settings and profile
```

---

## 🔵 3. ADMIN (MEDSZOP TEAM)

### Who is this?
MedsZop internal team members managing:
- Platform operations and maintenance
- User and pharmacy management
- Order monitoring and dispute resolution
- System configuration and analytics
- AI prescription model oversight
- Financial and commission management

### Login Method
- **Email + Password**
- Role: `admin`
- Highly restricted access - credentials managed by CTO/Founder

### Demo Credentials
```
Email: admin@medszop.com
Password: admin123
```

### Features

#### 🧑‍💼 User Management
- View all registered customers
- Block/unblock users for violations
- View user order history and spending
- Monitor suspicious activities
- Send notifications to users
- User feedback and complaint resolution

#### 🏪 Pharmacy Management
- View all pharmacy registrations
- Approve/reject pharmacy applications
- Verify pharmacy licenses and documents
- Activate/deactivate pharmacy accounts
- Monitor pharmacy performance
- Commission and payout management
- Send compliance notices

#### 📦 Order Monitoring
- View all orders platform-wide
- Check delivery performance metrics
- Resolve customer-pharmacy disputes
- Monitor order fulfillment times
- Handle order cancellations and refunds
- Investigate fraud cases

#### 🤖 AI Prescription Oversight
- Review AI scanning accuracy
- Monitor prescription verification errors
- Override pharmacy decisions if needed
- Improve AI model with feedback
- Manage prohibited medicine list
- Regulatory compliance checks

#### 💳 Subscription Management
- View all active subscriptions
- Revenue tracking from subscriptions
- Handle subscription disputes
- Process refunds/cancellations
- Monitor subscription churn rate
- Premium feature analytics

#### 📊 Analytics & Reports
- Total registered users (customers + pharmacies)
- Daily/monthly order statistics
- Average delivery time metrics
- Top-selling medicines
- Revenue by category and pharmacy
- Popular medicine trends
- Payment success rate
- Customer satisfaction scores
- AI prescription accuracy metrics
- Custom date range reports

#### ⚙️ System Settings
- Manage medicine categories
- Set commission rates for pharmacies
- Enable/disable features
- Configure delivery zones
- Manage payment gateways
- API key and integration management
- Email templates and notifications
- Emergency maintenance mode

#### 👤 Admin Profile
- Admin account settings
- Logout

### Admin Dashboard Routes
```
/admin/dashboard              - Admin overview and statistics
/admin/users                  - User management
/admin/users/:id              - User details
/admin/pharmacies             - Pharmacy management
/admin/pharmacies/:id         - Pharmacy details
/admin/orders                 - Order monitoring
/admin/orders/:id             - Order details
/admin/subscriptions          - Subscription management
/admin/analytics              - Detailed analytics and reports
/admin/settings               - System configuration
/admin/settings/categories    - Manage medicine categories
/admin/settings/commissions   - Commission rates
/admin/settings/features      - Feature toggles
/admin/compliance             - Compliance and audit logs
```

---

## 🔐 Role-Based Access Control Implementation

### User Schema
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'pharmacy' | 'admin';  // Required field
  addresses: Address[];
  orders: Order[];
  savedPrescriptions: Prescription[];
}
```

### Authentication Flow

#### 1. Login Process
```typescript
// Login is role-specific
authService.login(email: string, password: string, role: 'user' | 'pharmacy' | 'admin')
```

**Flow:**
1. User selects role (Customer, Pharmacy, or Admin)
2. Enters email and password
3. System validates against role-specific credentials
4. On success: JWT token stored in localStorage
5. User object stored with role information
6. Page redirects based on role

#### 2. Route Protection
```typescript
// App.tsx - Authentication guard
if (!isLoggedIn) {
  // Show login page
  return <Login />;
}

// Role-based routing
if (user.role === 'admin') {
  return <AdminDashboard />;
} else if (user.role === 'pharmacy') {
  return <PharmacyDashboard />;
} else {
  return <CustomerApp />;
}
```

#### 3. Session Persistence
```typescript
// On app load, check localStorage
const storedUser = authService.getCurrentUser();
if (storedUser) {
  setIsLoggedIn(true);
  // Route based on user.role
}
```

### After Login - Redirection
| Role | Redirects To | Dashboard |
|------|------------|-----------|
| Customer | `/home` | Shopping, orders, profile |
| Pharmacy | `/pharmacy/dashboard` | Order management, inventory |
| Admin | `/admin/dashboard` | Analytics, user/pharmacy management |

### Logout Behavior
- Clears JWT token from localStorage
- Clears user object
- Redirects to login page
- All session data cleared
- Cart items cleared (for customers)

---

## 🧭 Demo Account Quick Access

### Customer Demo
```
Quick Demo Button: "Demo Customer"
Email: user@test.com
Password: password123
```

### Pharmacy Demo
```
Quick Demo Button: "Demo Pharmacy"
Email: pharmacy@healthplus.com
Password: pharmacy123
```

### Admin Demo
```
Quick Demo Button: "Demo Admin"
Email: admin@medszop.com
Password: admin123
```

---

## 🔒 Security Best Practices

### Password Requirements
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers
- Special characters recommended
- Encrypted storage (bcrypt)

### Authentication
- JWT tokens with expiration (24 hours)
- Refresh token rotation
- Secure HTTP-only cookies
- CORS protection
- Rate limiting on login attempts

### Authorization
- Role-based route protection
- API endpoint role validation
- Audit logs for admin actions
- Suspicious activity monitoring
- Session timeout after inactivity

### Data Protection
- HTTPS only in production
- Encrypted sensitive data
- User privacy compliance (GDPR/CCPA)
- PCI compliance for payments
- Regular security audits

---

## 🏁 Key Implementation Files

### Frontend
- **App.tsx** - Main app with role-based routing
- **Login.tsx** - Role-specific login interface
- **authService.ts** - Authentication logic
- **types.ts** - User and role types
- **PharmacyDashboard.tsx** - Pharmacy interface
- **AdminDashboard.tsx** - Admin interface

### Backend (API)
- **authController.ts** - Authentication endpoints
- **auth.middleware.ts** - JWT verification
- **User.ts** - User model with role
- **routes/auth.routes.ts** - Auth endpoints
- **RBAC validation** - Role checking middleware

---

## 📋 Feature Matrix

| Feature | Customer | Pharmacy | Admin |
|---------|----------|----------|-------|
| Buy Medicines | ✅ | ❌ | ❌ |
| Upload Prescriptions | ✅ | ❌ | ❌ |
| AI Prescription Scan | ✅ | ❌ | ❌ |
| Subscribe Plans | ✅ | ❌ | ❌ |
| Doctor Consultation | ✅ | ❌ | ❌ |
| Accept Orders | ❌ | ✅ | ❌ |
| Manage Inventory | ❌ | ✅ | ❌ |
| Verify Prescriptions | ❌ | ✅ | ❌ |
| View Analytics | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| Manage Pharmacies | ❌ | ❌ | ✅ |
| System Settings | ❌ | ❌ | ✅ |
| Dispute Resolution | ❌ | ❌ | ✅ |
| Financial Reports | ❌ | ✅ | ✅ |

---

## 🚀 Future Enhancements

1. **Two-Factor Authentication (2FA)**
   - SMS OTP for customers
   - Email OTP for pharmacy/admin

2. **Social Login**
   - Google Sign-in for customers
   - SSO for admin team

3. **Role Permissions**
   - Fine-grained permissions beyond roles
   - Custom admin roles
   - Pharmacy manager vs owner

4. **Audit Trail**
   - Complete action history
   - Compliance reporting
   - Regulatory audits

5. **API Access**
   - API keys for integrations
   - Webhook support
   - Third-party pharmacy apps

---

## Summary

This role-based system makes MedsZop a **professional, scalable, real multi-vendor health-tech platform** where:

- **Customers** focus on buying medicines and healthcare
- **Pharmacies** focus on fulfilling orders and managing inventory  
- **Admin** focus on platform operations and quality assurance

Each role has clear boundaries, features, and responsibilities, ensuring security and operational efficiency.
