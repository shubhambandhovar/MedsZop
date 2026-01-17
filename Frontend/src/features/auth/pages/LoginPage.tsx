/**
 * Refactored Login Component
 * Production-grade login with new auth architecture
 * 
 * ⚠️ CRITICAL: LOGIN PAGE DARK MODE IS LOCKED ⚠️
 * 
 * This component and its parent AuthLayout use INLINE STYLES with exact
 * hex colors to maintain the approved dark mode design. The theme toggle
 * button changes global theme state but does NOT affect login page appearance.
 * 
 * 🚫 DO NOT:
 * - Replace inline styles with Tailwind dark: classes
 * - Change any color values (hex codes are exact from approved design)
 * - Remove inline style attributes
 * - Apply global theme variables or classes
 * - Refactor styles to external CSS
 * 
 * ✅ THEME TOGGLE BEHAVIOR:
 * - Toggle changes theme for OTHER pages only
 * - Login page appearance remains fixed
 * - All login styles use inline CSS (highest specificity)
 * - AuthLayout has isolation: 'isolate' to prevent cascade
 * 
 * If automated theme refactoring tools run, they must SKIP this file
 * and AuthLayout.tsx. Consult project lead before making any style changes.
 */

import React, { useState } from 'react';
import { AuthLayout } from '../../../app/components/auth/AuthLayout';
import { FloatingInput } from '../../../app/components/auth/FloatingInput';
import { OTPModal } from '../../../app/components/auth/OTPModal';
import { useTheme } from '../../../app/contexts/ThemeContext';
import { useAuth, useForm, ValidationUtils, ErrorHandler, AUTH_CONSTANTS } from '../index';
import { startPhoneLogin, confirmPhoneOtp, googleLogin } from '../../../services/firebaseAuth';
import { Moon, Sun, Chrome } from 'lucide-react';

interface NewLoginProps {
  onNavigateToRegister: () => void;
}

export const NewLogin: React.FC<NewLoginProps> = ({ onNavigateToRegister }) => {
  const { actualTheme, toggleTheme } = useTheme();
  const { login } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);

  // OTP Login States
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [confirmation, setConfirmation] = useState<any>(null);

  const countryCodes = [
    { code: '+1', country: 'US/CA', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+39', country: 'Italy', flag: '🇮🇹' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+7', country: 'Russia', flag: '🇷🇺' },
    { code: '+55', country: 'Brazil', flag: '🇧🇷' },
    { code: '+52', country: 'Mexico', flag: '🇲🇽' },
    { code: '+34', country: 'Spain', flag: '🇪🇸' },
    { code: '+82', country: 'S. Korea', flag: '🇰🇷' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
    { code: '+66', country: 'Thailand', flag: '🇹🇭' },
    { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
    { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  ];

  // Form handling with custom hook
  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: (values: { email: string; password: string }) => ValidationUtils.validateLoginForm(values.email, values.password),
    onSubmit: async (values: { email: string; password: string }) => {
      try {
        await login({
          email: values.email,
          password: values.password,
        });

        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('savedEmail', values.email);
        }
      } catch (error) {
        // Error already handled in AuthContext
      }
    },
  });

  const handleGoogleLogin = async () => {
    try {
      const result = await googleLogin();
      
      if (result?.data?.success) {
        ErrorHandler.showSuccess(AUTH_CONSTANTS.SUCCESS.LOGIN);
        // Auth handled by context
      }
    } catch (error: any) {
      ErrorHandler.showError(error?.message || 'Google login failed');
      ErrorHandler.logError(error, 'NewLogin.handleGoogleLogin');
    }
  };

  const handlePhoneOTPRequest = async () => {
    if (!otpPhone || otpPhone.length < 10) {
      ErrorHandler.showError('Please enter a valid phone number');
      return;
    }

    const fullPhoneNumber = countryCode + otpPhone;

    try {
      const result = await startPhoneLogin(fullPhoneNumber);
      setConfirmation(result);
      setShowOTPModal(true);
      ErrorHandler.showSuccess('OTP sent successfully!');
    } catch (error: any) {
      ErrorHandler.showError(error?.message || 'Failed to send OTP');
      ErrorHandler.logError(error, 'NewLogin.handlePhoneOTPRequest');
    }
  };

  const handleOTPVerify = async (otp: string) => {
    if (!confirmation) return;

    try {
      const result = await confirmPhoneOtp(confirmation, otp);
      
      if (result?.data?.success) {
        ErrorHandler.showSuccess(AUTH_CONSTANTS.SUCCESS.LOGIN);
        setShowOTPModal(false);
        // Auth handled by context
      }
    } catch (error: any) {
      ErrorHandler.showError(error?.message || 'OTP verification failed');
      ErrorHandler.logError(error, 'NewLogin.handleOTPVerify');
      throw error;
    }
  };

  return (
    <AuthLayout>
      {/* 
        ⚠️ THEME TOGGLE - LOCKED STYLING ⚠️
        This toggle changes global theme state for OTHER pages only.
        Login page design is LOCKED and will NOT change with theme toggle.
        Button colors are inline-styled to match locked dark theme.
        DO NOT replace these inline styles with Tailwind classes.
      */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors"
          style={{
            backgroundColor: 'rgba(51, 65, 85, 0.8)',
            border: '1px solid rgba(71, 85, 105, 0.5)'
          }}
          aria-label="Toggle theme"
          title="This toggle changes theme for other pages only. Login page design is locked."
        >
          {actualTheme === 'dark' ? (
            <Sun className="w-5 h-5" style={{ color: '#fbbf24' }} />
          ) : (
            <Moon className="w-5 h-5" style={{ color: '#94a3b8' }} />
          )}
        </button>
      </div>

      <div className="space-y-6">
        {/* Email/Password Login */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <FloatingInput
            id="email"
            name="email"
            type="email"
            label="Email Address"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.email}
            required
          />

          <FloatingInput
            id="password"
            name="password"
            type="password"
            label="Password"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.password}
            required
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              {/* LOCKED COLOR: #cbd5e1 - Do not replace with Tailwind class */}
              <span className="ml-2 text-sm" style={{ color: '#cbd5e1' }}>
                Remember me
              </span>
            </label>
            <button
              type="button"
              onClick={() => {
                ErrorHandler.showSuccess('Password reset feature coming soon! Please contact support at support@medszop.com');
              }}
              className="text-sm hover:underline"
              style={{ color: '#60a5fa' }}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full" style={{ borderTop: '1px solid rgba(71, 85, 105, 0.6)' }}></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2" style={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', color: '#94a3b8' }}>Or continue with</span>
          </div>
        </div>

        {/* Social Login */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center gap-3 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            style={{
              backgroundColor: 'rgba(51, 65, 85, 0.8)',
              border: '1px solid rgba(71, 85, 105, 0.6)',
              color: '#e2e8f0'
            }}
          >
            <Chrome className="w-5 h-5" />
            Continue with Google
          </button>
        </div>

        {/* Phone OTP Login */}
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid rgba(71, 85, 105, 0.6)' }}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2" style={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', color: '#94a3b8' }}>Or use phone</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-24 px-2 py-3 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium transition-all text-sm"
                style={{
                  backgroundColor: 'rgba(51, 65, 85, 0.8)',
                  border: '2px solid rgba(71, 85, 105, 0.6)',
                  color: '#f8fafc'
                }}
              >
                {countryCodes.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.flag} {item.code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                placeholder="9876543210"
                value={otpPhone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setOtpPhone(value);
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>
            
            <button
              onClick={handlePhoneOTPRequest}
              type="button"
              disabled={otpPhone.length < 10}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:cursor-not-allowed"
            >
              Send OTP
            </button>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Enter your phone number without country code
            </p>
          </div>
        </div>

        {/* Register Link */}
        <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
            >
              Create Account
            </button>
          </p>
        </div>
      </div>

      {/* OTP Modal */}
      {showOTPModal && (
        <OTPModal
          isOpen={showOTPModal}
          onClose={() => setShowOTPModal(false)}
          onVerify={handleOTPVerify}
          onResend={handlePhoneOTPRequest}
          phoneNumber={otpPhone}
        />
      )}
    </AuthLayout>
  );
};
