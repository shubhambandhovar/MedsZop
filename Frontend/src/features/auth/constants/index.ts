/**
 * Auth Feature Constants
 * Centralized constants for authentication
 */

export const AUTH_CONSTANTS = {
  // Storage Keys
  STORAGE_KEYS: {
    TOKEN: 'token',
    USER: 'user',
    REFRESH_TOKEN: 'refreshToken',
    THEME: 'theme',
  },

  // Token Expiry
  TOKEN_EXPIRY: {
    ACCESS_TOKEN: 60 * 60 * 1000, // 1 hour
    REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7 days
  },

  // Password Requirements
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
  },

  // Demo Credentials
  DEMO_USERS: {
    CUSTOMER: {
      email: 'customer@medszop.com',
      password: 'Customer@2026',
    },
    PHARMACY: {
      email: 'pharmacy@medszop.com',
      password: 'Pharmacy@2026',
    },
    ADMIN: {
      email: 'admin@medszop.com',
      password: 'Medsadmin@2026',
    },
  },

  // Validation Patterns
  PATTERNS: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
    INDIAN_PHONE: /^[6-9]\d{9}$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },

  // Error Messages
  ERRORS: {
    NETWORK: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'Session expired. Please login again.',
    INVALID_CREDENTIALS: 'Invalid email or password.',
    EMAIL_REQUIRED: 'Email is required.',
    PASSWORD_REQUIRED: 'Password is required.',
    PASSWORD_TOO_SHORT: 'Password must be at least 8 characters.',
    PASSWORD_WEAK: 'Password must include uppercase, lowercase, number, and special character.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    INVALID_PHONE: 'Please enter a valid phone number.',
    REGISTRATION_FAILED: 'Registration failed. Please try again.',
    LOGIN_FAILED: 'Login failed. Please try again.',
  },

  // Success Messages
  SUCCESS: {
    LOGIN: 'Successfully logged in!',
    REGISTER: 'Registration successful!',
    LOGOUT: 'Successfully logged out.',
    PASSWORD_RESET: 'Password reset email sent.',
  },

  // Routes
  ROUTES: {
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    ADMIN_DASHBOARD: '/admin',
    PHARMACY_DASHBOARD: '/pharmacy',
  },
} as const;

export const ROLE_PERMISSIONS = {
  user: ['view_medicines', 'place_order', 'upload_prescription', 'view_orders'],
  pharmacy: ['view_medicines', 'manage_inventory', 'view_orders', 'update_order_status'],
  admin: ['manage_users', 'manage_pharmacies', 'view_all_orders', 'manage_medicines', 'view_analytics'],
} as const;
