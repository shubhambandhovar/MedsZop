import React, { useState } from 'react';
import { OTPModal } from './auth/OTPModal';
import { useTheme } from '../contexts/ThemeContext';
import { authService } from '../../services/authService';
import { startPhoneLogin, confirmPhoneOtp } from '../../services/firebaseAuth';
import { toast } from 'sonner';
import { User } from '../types';
import { Moon, Sun } from 'lucide-react';

interface NewLoginProps {
  onLogin: (user: User) => void;
  onNavigateToRegister: () => void;
}

export const NewLogin: React.FC<NewLoginProps> = ({ onLogin, onNavigateToRegister }) => {
  const { actualTheme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

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
    if (!otpPhone || otpPhone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    const fullPhoneNumber = countryCode + otpPhone;

    setIsLoading(true);
    try {
      const confirmationResult = await startPhoneLogin(fullPhoneNumber);
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
    <div className="min-h-screen flex">
      {/* Left Panel - Blue Gradient */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 to-blue-600 p-12 flex-col justify-between text-white">
        {/* Logo and Branding */}
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <img src="/assets/M logo1.png" alt="MedsZop" className="w-10 h-10 object-contain" />
            </div>
            <span className="text-2xl font-bold">MedsZop</span>
          </div>

          <h1 className="text-4xl font-bold mb-6 leading-tight">
            Medicine at your<br />doorstep in 60 minutes
          </h1>
          
          <p className="text-lg text-blue-100 leading-relaxed">
            Your trusted healthcare partner for fast, reliable medicine delivery. Connect with verified pharmacies and get your prescriptions delivered quickly.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="font-semibold text-sm">Verified Pharmacies</p>
            <p className="text-xs text-blue-100 mt-1">All licensed</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="font-semibold text-sm">Secure Payments</p>
            <p className="text-xs text-blue-100 mt-1">100% safe</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="font-semibold text-sm">Fast Delivery</p>
            <p className="text-xs text-blue-100 mt-1">Within 60 mins</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Dark Theme Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 relative">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          aria-label="Toggle theme"
        >
          {actualTheme === 'dark' ? (
            <Sun className="h-5 w-5 text-yellow-400" />
          ) : (
            <Moon className="h-5 w-5 text-gray-300" />
          )}
        </button>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome back
            </h2>
            <p className="text-gray-400">
              Sign in to your account to continue
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  placeholder="Email"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors pl-11"
                />
                <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                />
                <span className="text-sm text-gray-400">Remember me</span>
              </label>
              
              <button
                type="button"
                onClick={() => {
                  toast.info('Password reset feature coming soon! Please contact support at support@medszop.com');
                }}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
                  checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Remember me</span>
            </label>
            
            <button
              type="button"
              onClick={() => {
                toast.info('Password reset feature coming soon! Please contact support at support@medszop.com');
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              OR CONTINUE WITH
            </span>
          </div>
        </div>

        {/* Social Login */}
        <div className="space-y-2">
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
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-center text-gray-700 dark:text-gray-300">
              Or login with Phone OTP
            </p>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-24 px-2 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium text-sm"
                  disabled={isLoading}
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
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={isLoading}
                />
              </div>
              
              <button
                type="button"
                onClick={handlePhoneOTPRequest}
                disabled={isLoading || otpPhone.length < 10}
                className="w-full py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send OTP'}
              </button>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Enter your phone number without country code
              </p>
            </div>
          </div>
        </div>

        {/* Register Link */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-400">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>

    {/* OTP Modal */}
    {showOTPModal && (
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onVerify={handleVerifyOTP}
        onResend={handleResendOTP}
        phoneNumber={countryCode + otpPhone}
      />
    )}

    {/* Firebase reCAPTCHA Container */}
    <div id="recaptcha-container"></div>
    </div>
  );
};
