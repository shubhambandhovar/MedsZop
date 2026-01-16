import React, { useState } from 'react';
import { AuthLayout } from './auth/AuthLayout';
import { FloatingInput } from './auth/FloatingInput';
import { PasswordStrengthIndicator } from './auth/PasswordStrengthIndicator';
import { FileUpload } from './auth/FileUpload';
import { useTheme } from '../contexts/ThemeContext';
import { authService } from '../../services/authService';
import { toast } from 'sonner';
import { User } from '../types';
import { Moon, Sun, UserCircle, Store, Calendar } from 'lucide-react';

interface NewRegisterProps {
  onRegister: (user: User) => void;
  onNavigateToLogin: () => void;
}

type UserType = 'customer' | 'pharmacy' | null;

export const NewRegister: React.FC<NewRegisterProps> = ({ onRegister, onNavigateToLogin }) => {
  const { actualTheme, toggleTheme } = useTheme();
  const [userType, setUserType] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Customer Form
  const [customerForm, setCustomerForm] = useState({
    fullName: '',
    dob: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });

  // Pharmacy Form
  const [pharmacyForm, setPharmacyForm] = useState({
    ownerName: '',
    email: '',
    contact: '',
    licenseNumber: '',
    password: '',
    confirmPassword: ''
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Note: licenseFile will be used when backend pharmacy registration is implemented

  const validateCustomerForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerForm.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!customerForm.dob) {
      newErrors.dob = 'Date of birth is required';
    }

    if (!customerForm.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerForm.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!customerForm.mobile) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(customerForm.mobile)) {
      newErrors.mobile = 'Mobile number must be 10 digits';
    }

    if (!customerForm.password) {
      newErrors.password = 'Password is required';
    } else if (customerForm.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (customerForm.password !== customerForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePharmacyForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!pharmacyForm.ownerName.trim()) {
      newErrors.ownerName = 'Owner name is required';
    }

    if (!pharmacyForm.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pharmacyForm.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!pharmacyForm.contact) {
      newErrors.contact = 'Contact number is required';
    } else if (!/^[0-9]{10}$/.test(pharmacyForm.contact)) {
      newErrors.contact = 'Contact number must be 10 digits';
    }

    if (!pharmacyForm.password) {
      newErrors.password = 'Password is required';
    } else if (pharmacyForm.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (pharmacyForm.password !== pharmacyForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCustomerForm()) return;

    setIsLoading(true);
    try {
      const result = await authService.register({
        name: customerForm.fullName,
        email: customerForm.email,
        password: customerForm.password,
        phone: customerForm.mobile,
        role: 'user'
      });

      if (result.success) {
        toast.success('Registration successful! Welcome to MedsZop');
        onRegister(result.data.user);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePharmacyRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePharmacyForm()) return;

    setIsLoading(true);
    try {
      const result = await authService.register({
        name: pharmacyForm.ownerName,
        email: pharmacyForm.email,
        password: pharmacyForm.password,
        phone: pharmacyForm.contact,
        role: 'pharmacy'
      });

      if (result.success) {
        toast.success('Pharmacy registration successful! Please wait for verification.');
        onRegister(result.data.user);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // User Type Selection Screen
  if (!userType) {
    return (
      <AuthLayout isDarkMode={actualTheme === 'dark'}>
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {actualTheme === 'dark' ? (
            <Sun className="h-5 w-5 text-yellow-500" />
          ) : (
            <Moon className="h-5 w-5 text-gray-700" />
          )}
        </button>

        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Create Account
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Choose your account type to get started
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setUserType('customer')}
              className="group relative p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl transition-all hover:shadow-lg"
            >
              <UserCircle className="h-12 w-12 mx-auto mb-3 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Customer</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Buy medicines</p>
            </button>

            <button
              onClick={() => setUserType('pharmacy')}
              className="group relative p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-2 border-green-200 dark:border-green-700 hover:border-green-400 dark:hover:border-green-500 rounded-xl transition-all hover:shadow-lg"
            >
              <Store className="h-12 w-12 mx-auto mb-3 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Pharmacy</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Partner with us</p>
            </button>
          </div>

          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button
                onClick={onNavigateToLogin}
                className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Customer Registration Form
  if (userType === 'customer') {
    return (
      <AuthLayout isDarkMode={actualTheme === 'dark'}>
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {actualTheme === 'dark' ? (
            <Sun className="h-5 w-5 text-yellow-500" />
          ) : (
            <Moon className="h-5 w-5 text-gray-700" />
          )}
        </button>

        <div className="space-y-6">
          <div>
            <button
              onClick={() => setUserType(null)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
            >
              ← Back to account type
            </button>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Customer Registration
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Create your customer account
              </p>
            </div>
          </div>

          <form onSubmit={handleCustomerRegister} className="space-y-4">
            <FloatingInput
              label="Full Name"
              type="text"
              value={customerForm.fullName}
              onChange={(e) => setCustomerForm({ ...customerForm, fullName: e.target.value })}
              error={errors.fullName}
              disabled={isLoading}
            />

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Date of Birth
              </label>
              <input
                type="date"
                value={customerForm.dob}
                onChange={(e) => setCustomerForm({ ...customerForm, dob: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                  errors.dob
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:border-primary-500'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                disabled={isLoading}
              />
              {errors.dob && <p className="mt-1 text-xs text-red-500">{errors.dob}</p>}
            </div>

            <FloatingInput
              label="Email Address"
              type="email"
              value={customerForm.email}
              onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
              error={errors.email}
              disabled={isLoading}
            />

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mobile Number
              </label>
              <div className="flex gap-2">
                <div className="w-20 px-3 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center">
                  +91
                </div>
                <input
                  type="tel"
                  value={customerForm.mobile}
                  onChange={(e) => setCustomerForm({ ...customerForm, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  placeholder="9876543210"
                  className={`flex-1 px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                    errors.mobile
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:border-primary-500'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  disabled={isLoading}
                />
              </div>
              {errors.mobile && <p className="mt-1 text-xs text-red-500">{errors.mobile}</p>}
            </div>

            <div>
              <FloatingInput
                label="Password"
                type="password"
                value={customerForm.password}
                onChange={(e) => setCustomerForm({ ...customerForm, password: e.target.value })}
                error={errors.password}
                showPasswordToggle
                disabled={isLoading}
              />
              <PasswordStrengthIndicator password={customerForm.password} />
            </div>

            <FloatingInput
              label="Confirm Password"
              type="password"
              value={customerForm.confirmPassword}
              onChange={(e) => setCustomerForm({ ...customerForm, confirmPassword: e.target.value })}
              error={errors.confirmPassword}
              showPasswordToggle
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button
                onClick={onNavigateToLogin}
                className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Pharmacy Registration Form
  return (
    <AuthLayout isDarkMode={actualTheme === 'dark'}>
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        {actualTheme === 'dark' ? (
          <Sun className="h-5 w-5 text-yellow-500" />
        ) : (
          <Moon className="h-5 w-5 text-gray-700" />
        )}
      </button>

      <div className="space-y-6">
        <div>
          <button
            onClick={() => setUserType(null)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            ← Back to account type
          </button>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Pharmacy Partner Registration
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Join MedsZop as a pharmacy partner
            </p>
          </div>
        </div>

        <form onSubmit={handlePharmacyRegister} className="space-y-4">
          <FloatingInput
            label="Pharmacy Owner Name"
            type="text"
            value={pharmacyForm.ownerName}
            onChange={(e) => setPharmacyForm({ ...pharmacyForm, ownerName: e.target.value })}
            error={errors.ownerName}
            disabled={isLoading}
          />

          <FloatingInput
            label="Pharmacy Email"
            type="email"
            value={pharmacyForm.email}
            onChange={(e) => setPharmacyForm({ ...pharmacyForm, email: e.target.value })}
            error={errors.email}
            disabled={isLoading}
          />

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contact Number
            </label>
            <div className="flex gap-2">
              <div className="w-20 px-3 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center">
                +91
              </div>
              <input
                type="tel"
                value={pharmacyForm.contact}
                onChange={(e) => setPharmacyForm({ ...pharmacyForm, contact: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="9876543210"
                className={`flex-1 px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                  errors.contact
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:border-primary-500'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                disabled={isLoading}
              />
            </div>
            {errors.contact && <p className="mt-1 text-xs text-red-500">{errors.contact}</p>}
          </div>

          <FloatingInput
            label="Pharmacy License Number (Optional)"
            type="text"
            value={pharmacyForm.licenseNumber}
            onChange={(e) => setPharmacyForm({ ...pharmacyForm, licenseNumber: e.target.value })}
            disabled={isLoading}
          />

          <FileUpload
            onFileSelect={setLicenseFile}
            label="Upload Pharmacy License Document (Optional)"
          />

          <div>
            <FloatingInput
              label="Password"
              type="password"
              value={pharmacyForm.password}
              onChange={(e) => setPharmacyForm({ ...pharmacyForm, password: e.target.value })}
              error={errors.password}
              showPasswordToggle
              disabled={isLoading}
            />
            <PasswordStrengthIndicator password={pharmacyForm.password} />
          </div>

          <FloatingInput
            label="Confirm Password"
            type="password"
            value={pharmacyForm.confirmPassword}
            onChange={(e) => setPharmacyForm({ ...pharmacyForm, confirmPassword: e.target.value })}
            error={errors.confirmPassword}
            showPasswordToggle
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-secondary-600 hover:bg-secondary-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {isLoading ? 'Creating Account...' : 'Register Pharmacy'}
          </button>
        </form>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-xs text-amber-800 dark:text-amber-400 text-center">
            Your pharmacy will be verified by our team within 24-48 hours
          </p>
        </div>

        <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <button
              onClick={onNavigateToLogin}
              className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};
