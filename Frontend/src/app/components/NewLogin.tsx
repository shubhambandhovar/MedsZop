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

// Login page specific styles
const loginPageStyles = `
  @keyframes gradient {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient 3s ease infinite;
  }
  .animate-fade-in {
    animation: fade-in 0.6s ease-out;
  }
`;

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
    <AuthLayout isDarkMode={actualTheme === 'dark'}>
      <style>{loginPageStyles}</style>
      
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-3 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 border border-gray-200 dark:border-gray-700 group"
        aria-label="Toggle theme"
      >
        {actualTheme === 'dark' ? (
          <Sun className="h-5 w-5 text-yellow-500 group-hover:rotate-180 transition-transform duration-500" />
        ) : (
          <Moon className="h-5 w-5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-500" />
        )}
      </button>

      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient mb-2">
            Welcome Back
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Sign in to continue to MedsZop
          </p>
          <div className="h-1 w-20 mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-3">
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
              onClick={() => {
                toast.info('Password reset feature coming soon! Please contact support at support@medszop.com');
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors duration-200 hover:scale-105 inline-block"
            >
              Forgot password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 hover:from-blue-700 hover:via-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition-all duration-300 disabled:cursor-not-allowed shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
            <span className="relative flex items-center justify-center gap-2">
              {isLoading && (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </span>
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
            className="group w-full py-3 px-4 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Chrome className="h-5 w-5 text-blue-600 group-hover:rotate-12 transition-transform duration-300" />
            <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Continue with Google</span>
          </button>

          {/* Phone OTP */}
          <div className="relative border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-2xl p-4 space-y-3 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 backdrop-blur-sm hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 bg-white dark:bg-gray-800">
              <p className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                📱 Or login with Phone OTP
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-24 px-2 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium text-sm transition-all duration-200 hover:border-blue-400"
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
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-blue-400"
                  disabled={isLoading}
                />
              </div>
              
              <button
                type="button"
                onClick={handlePhoneOTPRequest}
                disabled={isLoading || otpPhone.length < 10}
                className="group w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                <span className="relative">{isLoading ? 'Sending...' : 'Send OTP'}</span>
              </button>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Enter your phone number without country code
              </p>
            </div>
          </div>
        </div>

        {/* Register Link */}
        <div className="text-center pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:from-purple-600 hover:to-pink-600 font-bold transition-all duration-300 hover:scale-105 inline-block"
            >
              Create Account →
            </button>
          </p>
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
