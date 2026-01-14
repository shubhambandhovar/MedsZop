# Admin User Invite System - Testing Guide

## Overview
When you create a new admin user, an invite email is automatically sent (if SMTP is configured). The new admin receives an invite link to set their password and log in.

## System Flow

```
Super Admin Creates Admin → Email Invite Sent → Admin Sets Password → Admin Logs In
```

## Step-by-Step Testing

### Option 1: With Email (Recommended for Testing)

#### 1. Get Free Test Email Service
- Sign up at https://ethereal.email (free, no credit card)
- Copy your email and password
- Update `Backend/.env`:
  ```env
  SMTP_HOST=smtp.ethereal.email
  SMTP_PORT=587
  SMTP_USER=your_email@ethereal.email
  SMTP_PASS=your_password
  ```
- Restart backend: `npm run dev`

#### 2. Create Admin User
Visit: `http://localhost:5175/admin/dashboard`
- Log in as super admin (if needed, use the demo: `admin@medszop.com` / `Medsadmin@2026`)
- Click "Admin Management" in sidebar
- Click "Create New Admin"
- Fill in form:
  - **Name**: Shreya Shrivastava
  - **Email**: shreya@medszop.com
  - **Role**: admin (or super_admin)
  - **Department**: IT
  - **Permissions**: Check all boxes
  - **Status**: active
- Click "Create Admin"

#### 3. Check Invite Email
- Go to https://ethereal.email
- Log in with your test account
- Check "Messages" tab
- Open the email from "MedsZop Admin"
- Copy the "Set your password" link

#### 4. Accept Invite (Admin)
- Open the invite link in a new browser tab/window
- You'll see the "Set Your Password" page
- Enter a password meeting all requirements:
  - ✅ At least 6 characters
  - ✅ One uppercase letter
  - ✅ One number
  - ✅ One special character (!@#$%^&*)
  - Example: `Shreya@123`
- Confirm password
- Click "Set Password & Activate Account"
- Wait for redirect to login page

#### 5. Login as New Admin
- You're now on `/admin/login`
- Enter:
  - Email: `shreya@medszop.com`
  - Password: `Shreya@123`
- Click "Sign In"
- You should see the Admin Dashboard

---

### Option 2: Without Email (Manual Link Sharing)

If you skip SMTP setup, the invite link is still returned in the API response.

#### 1. Get the Invite Link from API Response
When you create an admin via the API, the response includes:
```json
{
  "success": true,
  "data": {
    "invite": {
      "link": "http://localhost:5174/admin/set-password/abc123token...",
      "expires": "2026-01-15T19:48:00Z",
      "emailSent": false
    }
  }
}
```

Or check the backend console—it will log the link if email isn't configured.

#### 2. Share Link Manually
- Copy the invite link
- Send it to the new admin (Shreya)
- Shreya opens the link in her browser
- Follow steps 4-5 above

---

## What Happens Behind the Scenes

### Create Admin API Response
```json
{
  "success": true,
  "message": "Admin user created and invite sent",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Shreya Shrivastava",
      "email": "shreya@medszop.com",
      "role": "admin",
      "department": "IT",
      "permissions": ["users", "orders", ...],
      "status": "active",
      "firstLogin": true
    },
    "invite": {
      "link": "http://localhost:5174/admin/set-password/token123...",
      "expires": "2026-01-15T19:48:00Z",
      "emailSent": true  // ← Shows if email was sent
    }
  }
}
```

### Password Reset Token
- Token is hashed with SHA256 and stored in DB
- Expires in 24 hours
- Can be used only once
- After password is set, token is cleared

### First Login Flag
- When created: `firstLogin = true`
- After setting password: `firstLogin = false`
- Future: Can enforce password change on first login

---

## Resending Invite

If the new admin loses the email or the link expires:

1. Go to Admin Management dashboard
2. Find the admin in the list
3. Click the "⋯" menu (if available) or look for "Resend Invite"
4. A new invite link is generated
5. If SMTP configured, new email is sent
6. Admin can use the new link to set password

---

## Environment Variables Reference

**For SMTP Configuration** (in `Backend/.env`):
```env
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_email@ethereal.email
SMTP_PASS=your_password
EMAIL_FROM=noreply@medszop.com
EMAIL_FROM_NAME=MedsZop Admin
```

**Default Values** (used if env var not set):
- `FRONTEND_URL`: `http://localhost:5174`
- `EMAIL_FROM`: `${SMTP_USER}` or `no-reply@medszop.com`
- `EMAIL_FROM_NAME`: `MedsZop Admin`

---

## Troubleshooting

### Email not sent, but link shows in response
- SMTP not configured (check `.env`)
- Link is still valid—share it manually with the admin

### "Invalid or expired token" when setting password
- Token expired (24-hour limit)
- Token already used
- Solution: Resend invite to generate new token

### Can't log in after setting password
- Password doesn't meet requirements (check requirements list)
- Typo in email or password
- Admin status is "inactive" (activate in Admin Management)

### Admin list shows "No admins found"
- No admin users created yet
- Logged in as regular user (need admin role)

---

## Demo Credentials

**Super Admin** (for testing):
- Email: `admin@medszop.com`
- Password: `Medsadmin@2026`
- Role: `super_admin`
- Permissions: All

---

## File Locations

- **Mailer Logic**: [Backend/src/utils/email.ts](Backend/src/utils/email.ts)
- **Admin Controller**: [Backend/src/controllers/adminUserController.ts](Backend/src/controllers/adminUserController.ts)
- **Admin Routes**: [Backend/src/routes/admin.routes.ts](Backend/src/routes/admin.routes.ts)
- **Set Password UI**: [Frontend/src/app/components/AdminSetPassword.tsx](Frontend/src/app/components/AdminSetPassword.tsx)
- **Admin Login UI**: [Frontend/src/app/components/AdminLogin.tsx](Frontend/src/app/components/AdminLogin.tsx)

---

## Next Steps (Optional)

- [ ] Set up production email (SendGrid, AWS SES, etc.)
- [ ] Add "Resend Invite" button in Admin Management UI
- [ ] Enforce password change on first login
- [ ] Add admin activity logging
- [ ] Add two-factor authentication (2FA) for admins
- [ ] Implement password reset for existing admins
