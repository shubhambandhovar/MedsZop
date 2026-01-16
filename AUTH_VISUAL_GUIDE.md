# 🎨 MedsZop Auth System - Visual Guide

## 📱 Screen Flow

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                    APP LOADS (Not Logged In)                 │
│                                                               │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                     🔐 NEW LOGIN SCREEN                       │
│                                                               │
│  ┌─────────────────┐                  ┌──────────────────┐  │
│  │                 │                  │                  │  │
│  │  LEFT PANEL     │                  │  RIGHT PANEL     │  │
│  │  (Desktop Only) │                  │  (Auth Form)     │  │
│  │                 │                  │                  │  │
│  │  • Logo         │                  │  Welcome Back    │  │
│  │  • Tagline      │                  │                  │  │
│  │  • Illustration │                  │  [Email Input]   │  │
│  │  • Trust Badges │                  │  [Password]      │  │
│  │                 │                  │  ☐ Remember Me   │  │
│  │                 │                  │  Forgot Password?│  │
│  │                 │                  │                  │  │
│  │                 │                  │  [Sign In]       │  │
│  │                 │                  │                  │  │
│  │                 │                  │  --- OR ---      │  │
│  │                 │                  │                  │  │
│  │                 │                  │  [Google Login]  │  │
│  │                 │                  │  [Phone OTP]     │  │
│  │                 │                  │                  │  │
│  │                 │                  │  Create Account→ │  │
│  └─────────────────┘                  └──────────────────┘  │
│                                                               │
│                      🌙 Theme Toggle (Top Right)             │
│                                                               │
└───────────────────────────┬──────────┬────────────────────────┘
                            │          │
                Click Login │          │ Click "Create Account"
                            │          │
                            ▼          ▼
                    ┌──────────┐   ┌──────────────────────────┐
                    │          │   │                          │
                    │   HOME   │   │  🎯 REGISTRATION FLOW    │
                    │   PAGE   │   │                          │
                    │          │   │  Step 1: Choose Type     │
                    └──────────┘   │                          │
                                   │  ┌────────┐  ┌────────┐  │
                                   │  │Customer│  │Pharmacy│  │
                                   │  │  👤    │  │   🏪   │  │
                                   │  └────────┘  └────────┘  │
                                   │                          │
                                   └──────────┬───────────────┘
                                              │
                        ┌─────────────────────┴──────────────┐
                        │                                    │
                        ▼                                    ▼
            ┌───────────────────────┐        ┌──────────────────────┐
            │  CUSTOMER REGISTER    │        │  PHARMACY REGISTER   │
            │                       │        │                      │
            │  • Full Name          │        │  • Owner Name        │
            │  • Date of Birth 📅   │        │  • Email             │
            │  • Email              │        │  • Contact Number    │
            │  • Mobile (+91)       │        │  • License Number    │
            │  • Password 🔒        │        │  • Upload License 📄 │
            │    [Strength Bar]     │        │  • Password 🔒       │
            │  • Confirm Password   │        │    [Strength Bar]    │
            │                       │        │  • Confirm Password  │
            │  [Create Account]     │        │                      │
            │                       │        │  [Register Pharmacy] │
            └───────────┬───────────┘        └──────────┬───────────┘
                        │                               │
                        └───────────┬───────────────────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │  AUTO LOGIN   │
                            │   & REDIRECT  │
                            │   TO HOME     │
                            └───────────────┘
```

## 🎨 Component Hierarchy

```
ThemeProvider
├── NewLogin
│   ├── AuthLayout
│   │   ├── Left Panel (Desktop)
│   │   │   ├── Logo
│   │   │   ├── Tagline
│   │   │   ├── Illustration
│   │   │   └── Trust Badges
│   │   └── Right Panel (Form)
│   │       └── Login Form
│   ├── FloatingInput (Email)
│   ├── FloatingInput (Password w/ toggle)
│   └── OTPModal
│       └── 6 OTP Input Boxes
│
└── NewRegister
    ├── User Type Selection
    │   ├── Customer Card
    │   └── Pharmacy Card
    │
    ├── Customer Form
    │   ├── FloatingInput (Name)
    │   ├── Date Picker (DOB)
    │   ├── FloatingInput (Email)
    │   ├── Mobile Input (+91)
    │   ├── FloatingInput (Password)
    │   ├── PasswordStrengthIndicator
    │   └── FloatingInput (Confirm)
    │
    └── Pharmacy Form
        ├── FloatingInput (Owner Name)
        ├── FloatingInput (Email)
        ├── Mobile Input (+91)
        ├── FloatingInput (License #)
        ├── FileUpload (License Doc)
        ├── FloatingInput (Password)
        ├── PasswordStrengthIndicator
        └── FloatingInput (Confirm)
```

## 🎭 Theme Comparison

### Light Mode
```
┌─────────────────────────────────────────┐
│  ☀️  MedsZop                    [🌙]    │
├─────────────────────────────────────────┤
│                                         │
│  White background                       │
│  Blue gradients (#1E88E5)               │
│  Soft shadows                           │
│  Clean borders                          │
│  High readability                       │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  White card                       │ │
│  │  Blue accents                     │ │
│  │  Gray text                        │ │
│  │  [Blue Button]                    │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Dark Mode
```
┌─────────────────────────────────────────┐
│  🌙 MedsZop                    [☀️]    │
├─────────────────────────────────────────┤
│                                         │
│  Dark blue background                   │
│  Lighter blue accents                   │
│  Glassmorphism cards                    │
│  Frosted glass effect                   │
│  Neon highlights                        │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Dark glass card (blur)           │ │
│  │  Light blue accents               │ │
│  │  White text                       │ │
│  │  [Bright Blue Button]             │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 📐 Responsive Layouts

### Desktop (1024px+)
```
┌────────────────────────────────────────────────────────┐
│  🌙                                                     │
│                                                         │
│  ┌──────────────────┐    ┌──────────────────────────┐ │
│  │                  │    │                          │ │
│  │   BRANDING       │    │      AUTH FORM           │ │
│  │   PANEL          │    │                          │ │
│  │                  │    │  [Inputs]                │ │
│  │   • Logo         │    │  [Buttons]               │ │
│  │   • Tagline      │    │                          │ │
│  │   • Illustration │    │                          │ │
│  │   • Badges       │    │                          │ │
│  │                  │    │                          │ │
│  └──────────────────┘    └──────────────────────────┘ │
│                                                         │
└────────────────────────────────────────────────────────┘
      50% width                   50% width
```

### Tablet (768px - 1023px)
```
┌────────────────────────────────────┐
│  🌙                                │
│                                    │
│  ┌──────────────────────────────┐ │
│  │                              │ │
│  │      AUTH FORM               │ │
│  │                              │ │
│  │  [Inputs]                    │ │
│  │  [Buttons]                   │ │
│  │                              │ │
│  └──────────────────────────────┘ │
│                                    │
│  (Branding panel hidden)           │
│                                    │
└────────────────────────────────────┘
           Max 600px width
```

### Mobile (< 768px)
```
┌─────────────────────┐
│  🌙                 │
│                     │
│   ┌───────────┐     │
│   │   Logo    │     │
│   └───────────┘     │
│                     │
│  MedsZop            │
│                     │
│ ┌─────────────────┐ │
│ │                 │ │
│ │  [Input]        │ │
│ │  [Input]        │ │
│ │                 │ │
│ │  [Button]       │ │
│ │                 │ │
│ └─────────────────┘ │
│                     │
└─────────────────────┘
     Full width
```

## 🎯 Feature Map

```
┌─────────────────────────────────────────────────────┐
│                    LOGIN SCREEN                      │
│                                                      │
│  ✅ Email/Password Login                            │
│  ✅ Show/Hide Password Toggle                       │
│  ✅ Remember Me Checkbox                            │
│  ✅ Forgot Password Link                            │
│  ✅ Google OAuth Button                             │
│  ✅ Phone OTP Login                                 │
│  ✅ Demo Credentials Display                        │
│  ✅ Create Account Link                             │
│  ✅ Theme Toggle (🌙/☀️)                            │
│  ✅ Form Validation                                 │
│  ✅ Loading States                                  │
│  ✅ Error Messages                                  │
│  ✅ Success Toasts                                  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                 REGISTRATION SCREEN                  │
│                                                      │
│  ✅ User Type Selection (Customer/Pharmacy)         │
│  ✅ Animated Card Selection                         │
│  ✅ Customer Form                                   │
│     • Full Name Input                               │
│     • Date of Birth Picker                          │
│     • Email Input                                   │
│     • Mobile Number (+91)                           │
│     • Password with Strength                        │
│     • Confirm Password                              │
│                                                      │
│  ✅ Pharmacy Form                                   │
│     • Owner Name Input                              │
│     • Email Input                                   │
│     • Contact Number                                │
│     • License Number (optional)                     │
│     • File Upload (drag & drop)                     │
│     • Password with Strength                        │
│     • Confirm Password                              │
│                                                      │
│  ✅ Back to Login Link                              │
│  ✅ Form Validation                                 │
│  ✅ Loading States                                  │
│  ✅ Theme Toggle                                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                    OTP MODAL                         │
│                                                      │
│  ✅ 6-Digit OTP Input                               │
│  ✅ Auto-Focus Next Box                             │
│  ✅ Paste Support                                   │
│  ✅ Backspace Navigation                            │
│  ✅ Countdown Timer (60s)                           │
│  ✅ Resend OTP Button                               │
│  ✅ Phone Number Display                            │
│  ✅ Verify Button                                   │
│  ✅ Close Button                                    │
│  ✅ Loading State                                   │
└─────────────────────────────────────────────────────┘
```

## 🎨 Color Palette

### Light Mode
```css
Primary:    #1E88E5  ████████  Medical Blue
Secondary:  #2ECC71  ████████  Soft Green
Accent:     #00BCD4  ████████  Light Teal
Background: #FFFFFF  ████████  White
Text:       #1F2937  ████████  Dark Gray
```

### Dark Mode
```css
Primary:    #42A5F5  ████████  Light Blue
Secondary:  #66BB6A  ████████  Light Green
Accent:     #26C6DA  ████████  Bright Teal
Background: #111827  ████████  Dark Blue Gray
Text:       #F9FAFB  ████████  Off White
```

## 🔄 State Flow

```
┌─────────────┐
│  NOT LOGGED │
│     IN      │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│   LOGIN     │────▶│  REGISTER   │
│   SCREEN    │◀────│   SCREEN    │
└──────┬──────┘     └──────┬──────┘
       │                   │
       │  Submit           │  Submit
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│  VALIDATE   │     │  VALIDATE   │
│    FORM     │     │    FORM     │
└──────┬──────┘     └──────┬──────┘
       │                   │
       │  Valid            │  Valid
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│   LOADING   │     │   LOADING   │
│    STATE    │     │    STATE    │
└──────┬──────┘     └──────┬──────┘
       │                   │
       │  Success          │  Success
       │                   │
       ▼                   ▼
┌─────────────────────────────────┐
│       LOGGED IN                 │
│    (Redirect to Dashboard)      │
└─────────────────────────────────┘
```

## 🎊 Complete!

This visual guide shows the complete structure of the MedsZop authentication system. All screens are responsive, accessible, and production-ready!

---

**Legend:**
- ✅ = Implemented
- 🔒 = Secure feature
- 📱 = Responsive
- 🎨 = Themed (light/dark)
- ⚡ = Animated
