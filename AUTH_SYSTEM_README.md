# MedsZop Premium Authentication System

## 🎨 Overview

This is a modern, premium authentication system built for MedsZop - a healthcare startup. The system features a clean, medical-themed UI with light/dark mode support, responsive design, and comprehensive security features.

## ✨ Features

### 🔐 Authentication Methods

1. **Email/Password Login**
   - Floating label inputs
   - Show/hide password toggle
   - Remember me checkbox
   - Forgot password link
   - Form validation

2. **Google OAuth**
   - One-click Google sign-in
   - Auto-account creation
   - Profile sync

3. **Phone OTP Login**
   - SMS-based OTP verification
   - 6-digit OTP input with auto-focus
   - Resend OTP with countdown timer
   - Firebase Authentication integration

### 📝 Registration Flow

**User Type Selection**
- Customer: For buying medicines
- Pharmacy: For partner pharmacies
- Admin: Invitation-only (no public registration)

**Customer Registration**
- Full Name
- Date of Birth (calendar picker)
- Email
- Mobile Number (+91 country code)
- Password with strength indicator
- Confirm Password

**Pharmacy Registration**
- Pharmacy Owner Name
- Pharmacy Email
- Contact Number
- License Number (optional)
- License Document Upload (drag & drop)
- Password with strength indicator
- Confirm Password

### 🎨 UI/UX Features

**Design System**
- Medical Blue Primary: `#1E88E5`
- Soft Green Secondary: `#2ECC71`
- Light Teal Accent
- Typography: Inter/Poppins/SF Pro
- Rounded corners and soft shadows

**Layout**
- **Desktop**: Split layout
  - Left: Branding, illustration, trust badges
  - Right: Authentication form
- **Mobile**: Stacked layout with responsive design

**Theme System**
- Light Mode
- Dark Mode (with glassmorphism)
- System-based auto-detection
- Manual toggle button

**Animations**
- Smooth page transitions
- Scale-in animations
- Fade effects
- Slide-up effects

### 🛡️ Security Features

- JWT-based authentication
- Secure token storage (localStorage)
- Password strength indicator
- Role-based access control (RBAC)
- Protected routes
- Email verification support
- Rate limiting for OTP requests
- Firebase Security Rules

## 📁 File Structure

```
Frontend/src/
├── app/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthLayout.tsx          # Main auth layout with branding
│   │   │   ├── FloatingInput.tsx       # Reusable floating label input
│   │   │   ├── PasswordStrengthIndicator.tsx
│   │   │   ├── FileUpload.tsx          # Drag & drop file upload
│   │   │   ├── OTPModal.tsx            # OTP verification modal
│   │   │   └── index.ts                # Exports
│   │   ├── NewLogin.tsx                # New login page
│   │   ├── NewRegister.tsx             # New registration page
│   │   └── ...
│   ├── contexts/
│   │   └── ThemeContext.tsx            # Theme provider (light/dark)
│   └── App.tsx                         # Updated with new auth flow
├── services/
│   ├── authService.ts                  # Auth API service (updated)
│   └── firebaseAuth.ts                 # Firebase auth helpers
└── styles/
    └── medical-theme.css               # Custom medical theme CSS
```

## 🚀 Usage

### Login

```tsx
import { NewLogin } from './components/NewLogin';

<NewLogin
  onLogin={(user) => handleLogin(user)}
  onNavigateToRegister={() => setAuthView('register')}
/>
```

### Register

```tsx
import { NewRegister } from './components/NewRegister';

<NewRegister
  onRegister={(user) => handleRegister(user)}
  onNavigateToLogin={() => setAuthView('login')}
/>
```

### Theme Provider

Wrap your app with ThemeProvider:

```tsx
import { ThemeProvider } from './contexts/ThemeContext';

<ThemeProvider>
  <App />
</ThemeProvider>
```

### Using Theme

```tsx
import { useTheme } from '../contexts/ThemeContext';

const { theme, actualTheme, setTheme, toggleTheme } = useTheme();
```

## 🔧 Components

### FloatingInput

Reusable input component with floating labels:

```tsx
<FloatingInput
  label="Email Address"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  showPasswordToggle={false}
  disabled={isLoading}
/>
```

### OTPModal

6-digit OTP verification modal:

```tsx
<OTPModal
  isOpen={showOTPModal}
  onClose={() => setShowOTPModal(false)}
  onVerify={handleVerifyOTP}
  onResend={handleResendOTP}
  phoneNumber={phoneNumber}
/>
```

### FileUpload

Drag & drop file upload:

```tsx
<FileUpload
  onFileSelect={(file) => setLicenseFile(file)}
  accept=".pdf,.jpg,.jpeg,.png"
  label="Upload License"
/>
```

## 🎨 Theming

### CSS Variables

```css
:root {
  --primary-500: #1E88E5;
  --secondary-500: #2ECC71;
  --accent-500: #00bcd4;
}
```

### Dark Mode Classes

```css
.dark {
  --primary-500: #42a5f5;
  --secondary-500: #66bb6a;
}
```

### Custom Animations

- `.animate-scale-in` - Scale in animation
- `.animate-fade-in` - Fade in animation
- `.animate-slide-up` - Slide up animation

## 🔒 Admin Access

**Important**: Admin accounts cannot be created through public registration.

**Admin Creation Process**:
1. Founder (super_admin) creates admin via Admin Panel
2. Admin receives invite email with token
3. Admin sets password using invite link
4. Admin can then login normally

## 📱 Responsive Design

- **Desktop**: 1024px+ (split layout)
- **Tablet**: 768px - 1023px (stacked)
- **Mobile**: < 768px (full stacked)

## 🧪 Admin Credentials

**Admin** (Development only):
- Email: `admin@medszop.com`
- Password: `Medsadmin@2026`

**Note**: All demo customer and pharmacy accounts have been removed. Users must register through the registration flow.

## 🔥 Firebase Setup

Required for Phone OTP:

1. Add Firebase config to `firebase.ts`
2. Enable Phone Authentication in Firebase Console
3. Add authorized domains
4. Include reCAPTCHA container: `<div id="recaptcha-container"></div>`

## 🌐 Environment Variables

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
```

## ✅ Accessibility

- Focus states with visible outlines
- ARIA labels on interactive elements
- Keyboard navigation support
- High contrast in dark mode
- Screen reader friendly

## 🎯 Best Practices

1. **Form Validation**: Client-side + server-side
2. **Error Handling**: Clear, user-friendly messages
3. **Loading States**: Disabled buttons during submission
4. **Security**: Never expose sensitive data
5. **Responsive**: Mobile-first approach
6. **Performance**: Code splitting, lazy loading

## 📄 License

MIT License - MedsZop 2026

---

Built with ❤️ using React, TypeScript, Tailwind CSS, and Firebase
