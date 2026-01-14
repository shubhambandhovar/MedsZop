# Admin Management - Quick Start

## How to Create a New Admin User

### Via Frontend UI (Easiest)

1. **Login as Super Admin** (or existing admin)
   - Use demo credentials or your admin account

2. **Navigate to Admin Management**
   - Sidebar → "Admin Management" (Shield icon)
   - Click **"Create New Admin"** button

3. **Fill the Form**
   ```
   Full Name:        Ankit Verma
   Official Email:   ankit@medszop.com        (must be @medszop.com)
   Role:             Admin                    (or Super Admin)
   Department:       Operations               (optional)
   Permissions:      ☑ Orders   ☑ Pharmacies  (check what they need)
   Status:           Active
   ```

4. **Click Create Admin**
   - Admin record created
   - Invite link displayed
   - **TODO:** Email sent automatically (integrate mailer)

5. **Share Invite Link with Admin**
   - Format: `http://localhost:5174/admin/set-password/{token}`
   - Valid for 24 hours
   - Admin clicks → sets password → logs in

---

## Via Backend API (For Testing)

### 1. Create Admin
```bash
curl -X POST http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer {your_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ankit Verma",
    "email": "ankit@medszop.com",
    "role": "admin",
    "department": "Operations",
    "permissions": ["orders", "pharmacies"],
    "status": "active"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Admin user created and invite sent",
  "data": {
    "user": { ... },
    "invite": {
      "link": "http://localhost:5174/admin/set-password/abc123def456...",
      "expires": "2026-01-15T12:30:00Z"
    }
  }
}
```

### 2. Admin Sets Password
```bash
curl -X POST http://localhost:5000/api/admin/set-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123def456...",
    "password": "SecurePassword123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Password set successfully"
}
```

### 3. Admin Logs In
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ankit@medszop.com",
    "password": "SecurePassword123"
  }'
```

**Response includes:**
```json
{
  "data": {
    "user": {
      "id": "...",
      "email": "ankit@medszop.com",
      "role": "admin",
      "permissions": ["orders", "pharmacies"],
      "status": "active",
      "firstLogin": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR..."
  }
}
```

---

## Admin Roles & Permissions

### Super Admin
- **Can do:** Everything
- **Permissions:** All (users, pharmacies, orders, prescriptions, subscriptions, analytics)
- **Special:** Create/manage other admins

### Admin
- **Can do:** Manage assigned areas
- **Permissions:** Selected subset (e.g., orders + pharmacies only)
- **Special:** Cannot create other admins

### Permission Meanings
| Permission | What They Can Do |
|---|---|
| `users` | View users, block/unblock accounts |
| `pharmacies` | Approve/reject pharmacies, deactivate |
| `orders` | View orders, reassign to pharmacy, cancel |
| `prescriptions` | Review prescriptions, override AI decisions, flag errors |
| `subscriptions` | Manage subscriptions, pause/cancel, handle refunds |
| `analytics` | View reports, export data, revenue metrics |

---

## Frontend: Admin Management Section

### What You See
- **List of All Admins** with:
  - Name, Email, Role
  - Assigned Department
  - Permissions (as badges)
  - Status (active/inactive)
  - Edit/Delete buttons

### Actions
- **Create New Admin** → Opens form modal
- **Edit Admin** → Update permissions/department
- **Delete Admin** → Remove from system

### Validation
- Name required
- Email required + must be @medszop.com
- At least 1 permission required
- Form errors show as toasts

---

## Current Mock Data (Frontend)

Two admins pre-created for testing:

**Admin 1:**
- Name: Admin User
- Email: admin@medszop.com
- Role: Admin
- Department: Operations
- Permissions: users, orders
- Status: Active
- Created: 2 weeks ago

**Admin 2:**
- Name: Support Admin
- Email: support@medszop.com
- Role: Admin
- Department: Support
- Permissions: users, prescriptions
- Status: Active
- Created: 1 week ago

---

## Troubleshooting

### "Email must be a company email (@medszop.com)"
- Check email format in form
- Must end with `@medszop.com`
- Example: `name@medszop.com` ✅, `name@gmail.com` ❌

### "Please select at least one permission"
- You unchecked all permissions
- Select at least one checkbox (e.g., Orders)

### Password reset link not working
- Link expires in 24 hours
- Use the latest link from create response
- Resend invite to generate new link

### Admin can't login after password setup
- Check status is "active" (not inactive)
- Verify password is correct
- Check email domain in JWT

---

## Feature Checklist

- [x] Backend: Create admin endpoint
- [x] Backend: List admins endpoint
- [x] Backend: Set password (invite acceptance)
- [x] Backend: Permission validation
- [x] Backend: JWT includes role/permissions
- [x] Frontend: Admin Management section
- [x] Frontend: Create admin form with validation
- [x] Frontend: Admin list table
- [x] Frontend: Invite link generation
- [ ] Email service integration (TODO)
- [ ] First-login password change page (TODO)
- [ ] Activity logging (TODO)
- [ ] Frontend: Set-password page `/admin/set-password/:token`

---

## Next: Integration Steps

### 1. Email Service (Now)
Update `Backend/src/controllers/adminUserController.ts` line 52:
```typescript
// TODO: integrate real mailer; for now, expose invite link in response for testing

// Add actual email sending:
await mailer.send({
  to: user.email,
  subject: 'MedsZop Admin Access',
  html: `Click here to set password: ${inviteLink}`
});
```

### 2. Set-Password Frontend Page
Create `Frontend/src/app/components/AdminSetPassword.tsx`
- Route: `/admin/set-password/:token`
- Fields: password, confirm password
- POST to `/api/admin/set-password`

### 3. First-Login Enforcement
In login response, check `firstLogin` flag
- If true → Redirect to change password page
- If false → Allow dashboard access

### 4. Activity Logging
Add `AdminActivity` model and log:
- Admin created
- Permissions changed
- Status changed
- Admin login/logout

---

## Testing Workflow

```
1. Go to http://localhost:5174 (Frontend)
2. Login as admin
3. Navigate to "Admin Management"
4. Click "Create New Admin"
5. Fill form (e.g., name=Test, email=test@medszop.com, check "Orders")
6. Click "Create Admin"
7. See toast: "Admin user created successfully"
8. View admin in list below
9. Test delete button → removes from list
10. Edit button → (future implementation)
```

---

## Important Notes

⚠️ **Current State:**
- Frontend creates mock admins (not hitting backend yet)
- Backend endpoints ready for API integration
- Email not integrated (invite link shown in response)
- First-login enforcement not implemented

✅ **To Make Fully Functional:**
1. Wire frontend form to backend API
2. Add email service
3. Create set-password frontend page
4. Implement first-login check in Auth

---

Need help? Check `ADMIN_MANAGEMENT_GUIDE.md` for complete technical details.
