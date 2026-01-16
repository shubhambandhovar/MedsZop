import React, { useState } from 'react';
import { AuthLayout } from './auth/AuthLayout';
import { FloatingInput } from './auth/FloatingInput';
import { OTPModal } from './auth/OTPModal';
import { useTheme } from '../contexts/ThemeContext';
import { authService } from '../../services/authService';
import { startPhoneLogin, confirmPhoneOtp } from '../../services/firebaseAuth';
import { toast } from 'sonner';
import { User } from '../types';
import { Moon, Sun, Chrome } from 'lucide-react';

interface NewLoginProps {
  onLogin: (user: User) => void;
  onNavigateToRegister: () => void;
}

export const NewLogin: React.FC<NewLoginProps> = ({ onLogin, onNavigateToRegister }) => {
  const { actualTheme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // OTP Login States
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');
  const [confirmation, setConfirmation] = useState<any>(null);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Generic login - no role specified
      const result = await authService.login(email, password);
      
      if (result.success) {
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('savedEmail', email);
        }
        
        toast.success('Login successful!');
        onLogin(result.data.user);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Import dynamically to avoid issues
      const { googleLogin } = await import('../../services/firebaseAuth');
      const result = await googleLogin();
      
      if (result?.data?.success) {
        localStorage.setItem('token', result.data.data.token);
        authService.saveCurrentUser(result.data.data.user);
        toast.success('Google login successful!');
        onLogin(result.data.data.user);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneOTPRequest = async () => {
    if (!otpPhone || !otpPhone.startsWith('+')) {
      toast.error('Please enter a valid phone number with country code (e.g., +919876543210)');
      return;
    }

    setIsLoading(true);
    try {
      const confirmationResult = await startPhoneLogin(otpPhone);
      setConfirmation(confirmationResult);
      setShowOTPModal(true);
      toast.success('OTP sent successfully!');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    try {
      const result = await confirmPhoneOtp(confirmation, otp);
      
      if (result?.data?.success) {
        localStorage.setItem('token', result.data.data.token);
        authService.saveCurrentUser(result.data.data.user);
        toast.success('Phone login successful!');
        onLogin(result.data.data.user);
        setShowOTPModal(false);
      }
    } catch (error: any) {
      toast.error(error?.message || 'OTP verification failed');
      throw error;
    }
  };

  const handleResendOTP = async () => {
    return handlePhoneOTPRequest();
  };

  return (
    <AuthLayout isDarkMode={actualTheme === 'dark'}>
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        aria-label="Toggle theme"
      >
        {actualTheme === 'dark' ? (
          <Sun className="h-5 w-5 text-yellow-500" />
        ) : (
          <Moon className="h-5 w-5 text-gray-700" />
        )}
      </button>

      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to continue to MedsZop
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <FloatingInput
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            disabled={isLoading}
          />

          <FloatingInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            showPasswordToggle
            disabled={isLoading}
          />

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Remember me</span>
            </label>
            
            <button
              type="button"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              OR CONTINUE WITH
            </span>
          </div>
        </div>

        {/* Social Login */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors flex items-center justify-center gap-3"
          >
            <Chrome className="h-5 w-5 text-blue-600" />
            Continue with Google
          </button>

          {/* Phone OTP */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-center text-gray-700 dark:text-gray-300">
              Or login with Phone OTP
            </p>
            
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="+919876543210"
                value={otpPhone}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^0-9+]/g, '');
                  if (!value.startsWith('+')) value = '+' + value.replace(/\+/g, '');
                  setOtpPhone(value);
                }}
                className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={handlePhoneOTPRequest}
                disabled={isLoading || !otpPhone.startsWith('+') || otpPhone.length < 10}
                className="px-6 py-2 bg-secondary-600 hover:bg-secondary-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                Send OTP
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Format: +[country code][number]
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
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onVerify={handleVerifyOTP}
        onResend={handleResendOTP}
        phoneNumber={otpPhone}
      />

      {/* Firebase reCAPTCHA Container */}
      <div id="recaptcha-container" className="mt-4"></div>
    </AuthLayout>
  );
};
