/**
 * Refactored Login Component
 * Production-grade login with new auth architecture
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
  const [confirmation, setConfirmation] = useState<any>(null);

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
    if (!otpPhone || !otpPhone.startsWith('+')) {
      ErrorHandler.showError('Please enter a valid phone number with country code (e.g., +919876543210)');
      return;
    }

    try {
      const result = await startPhoneLogin(otpPhone);
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
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          aria-label="Toggle theme"
        >
          {actualTheme === 'dark' ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-gray-700" />
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
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Remember me
              </span>
            </label>
            <button
              type="button"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
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
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Social Login */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            <Chrome className="w-5 h-5" />
            Continue with Google
          </button>
        </div>

        {/* Phone OTP Login */}
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or use phone</span>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={otpPhone}
              onChange={(e) => setOtpPhone(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={handlePhoneOTPRequest}
              type="button"
              className="bg-secondary-600 hover:bg-secondary-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200"
            >
              Send OTP
            </button>
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

        {/* Demo Credentials */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
          <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 text-center">
            Demo Credentials
          </p>
          <div className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
            <p><strong>Customer:</strong> customer@medszop.com / Customer@2026</p>
            <p><strong>Pharmacy:</strong> pharmacy@medszop.com / Pharmacy@2026</p>
          </div>
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
