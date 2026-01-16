/**
 * Refactored Register Component
 * Production-grade registration with new auth architecture
 */

import React, { useState } from 'react';
import { AuthLayout } from '../../../app/components/auth/AuthLayout';
import { FloatingInput } from '../../../app/components/auth/FloatingInput';
import { PasswordStrengthIndicator } from '../../../app/components/auth/PasswordStrengthIndicator';
import { FileUpload } from '../../../app/components/auth/FileUpload';
import { useTheme } from '../../../app/contexts/ThemeContext';
import { useAuth, useForm, ValidationUtils } from '../index';
import { Moon, Sun, UserCircle, Store } from 'lucide-react';

interface NewRegisterProps {
  onNavigateToLogin: () => void;
}

type UserType = 'customer' | 'pharmacy' | null;

export const NewRegister: React.FC<NewRegisterProps> = ({ onNavigateToLogin }) => {
  const { actualTheme, toggleTheme } = useTheme();
  const { register } = useAuth();
  const [userType, setUserType] = useState<UserType>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  // Customer form
  const customerFormHook = useForm({
    initialValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
    validate: (values: { fullName: string; email: string; phone: string; password: string; confirmPassword: string }) => {
      const baseErrors = ValidationUtils.validateRegistrationForm({
        name: values.fullName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        role: 'user',
      });

      if (values.password !== values.confirmPassword) {
        baseErrors.confirmPassword = 'Passwords do not match.';
      }

      return baseErrors;
    },
    onSubmit: async (values: { fullName: string; email: string; phone: string; password: string; confirmPassword: string }) => {
      try {
        await register({
          name: values.fullName,
          email: values.email,
          phone: values.phone,
          password: values.password,
          role: 'user',
        });
      } catch (error) {
        // Error handled in AuthContext
      }
    },
  });

  // Pharmacy form
  const pharmacyFormHook = useForm({
    initialValues: {
      pharmacyName: '',
      ownerName: '',
      email: '',
      phone: '',
      licenseNumber: '',
      password: '',
      confirmPassword: '',
    },
    validate: (values: { pharmacyName: string; ownerName: string; email: string; phone: string; licenseNumber: string; password: string; confirmPassword: string }) => {
      const baseErrors = ValidationUtils.validateRegistrationForm({
        name: values.ownerName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        role: 'pharmacy',
        licenseNumber: values.licenseNumber,
        pharmacyName: values.pharmacyName,
      });

      if (values.password !== values.confirmPassword) {
        baseErrors.confirmPassword = 'Passwords do not match.';
      }

      if (!licenseFile) {
        baseErrors.licenseFile = 'License document is required.';
      }

      return baseErrors;
    },
    onSubmit: async (values: { pharmacyName: string; ownerName: string; email: string; phone: string; licenseNumber: string; password: string; confirmPassword: string }) => {
      try {
        await register({
          name: values.ownerName,
          email: values.email,
          phone: values.phone,
          password: values.password,
          role: 'pharmacy',
          licenseNumber: values.licenseNumber,
          pharmacyName: values.pharmacyName,
          licenseFile: licenseFile || undefined,
        });
      } catch (error) {
        // Error handled in AuthContext
      }
    },
  });

  const currentForm = userType === 'customer' ? customerFormHook : pharmacyFormHook;

  // User type selection view
  if (!userType) {
    return (
      <AuthLayout>
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {actualTheme === 'dark' ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-700" />
            )}
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-6">
            Select Account Type
          </h3>

          {/* Customer Card */}
          <button
            onClick={() => setUserType('customer')}
            className="w-full p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserCircle className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  Customer
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Order medicines, upload prescriptions, and track deliveries
                </p>
              </div>
            </div>
          </button>

          {/* Pharmacy Card */}
          <button
            onClick={() => setUserType('pharmacy')}
            className="w-full p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-200 dark:border-green-700 rounded-xl hover:border-secondary-500 dark:hover:border-secondary-500 transition-all duration-200 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-secondary-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Store className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  Pharmacy
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage inventory, fulfill orders, and grow your business
                </p>
              </div>
            </div>
          </button>

          {/* Login Link */}
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

  // Registration form view
  return (
    <AuthLayout>
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {actualTheme === 'dark' ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-gray-700" />
          )}
        </button>
      </div>

      {/* Back Button */}
      <button
        onClick={() => setUserType(null)}
        className="mb-4 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
      >
        ← Change Account Type
      </button>

      <form onSubmit={currentForm.handleSubmit} className="space-y-5">
        {userType === 'customer' ? (
          <>
            <FloatingInput
              id="fullName"
              name="fullName"
              type="text"
              label="Full Name"
              value={(currentForm.values as any).fullName || ''}
              onChange={currentForm.handleChange}
              onBlur={currentForm.handleBlur}
              error={currentForm.errors.fullName}
              required
            />

            <FloatingInput
              id="email"
              name="email"
              type="email"
              label="Email Address"
              value={currentForm.values.email || ''}
              onChange={currentForm.handleChange}
              onBlur={currentForm.handleBlur}
              error={currentForm.errors.email}
              required
            />

            <FloatingInput
              id="phone"
              name="phone"
              type="tel"
              label="Mobile Number"
              value={currentForm.values.phone || ''}
              onChange={currentForm.handleChange}
              onBlur={currentForm.handleBlur}
              error={currentForm.errors.phone}
              placeholder="10-digit mobile number"
              required
            />
          </>
        ) : (
          <>
            <FloatingInput
              id="pharmacyName"
              name="pharmacyName"
              type="text"
              label="Pharmacy Name"
              value={(currentForm.values as any).pharmacyName || ''}
              onChange={currentForm.handleChange}
              onBlur={currentForm.handleBlur}
              error={currentForm.errors.pharmacyName}
              required
            />

            <FloatingInput
              id="ownerName"
              name="ownerName"
              type="text"
              label="Owner Name"
              value={(currentForm.values as any).ownerName || ''}
              onChange={currentForm.handleChange}
              onBlur={currentForm.handleBlur}
              error={currentForm.errors.ownerName}
              required
            />

            <FloatingInput
              id="email"
              name="email"
              type="email"
              label="Email Address"
              value={currentForm.values.email || ''}
              onChange={currentForm.handleChange}
              onBlur={currentForm.handleBlur}
              error={currentForm.errors.email}
              required
            />

            <FloatingInput
              id="phone"
              name="phone"
              type="tel"
              label="Contact Number"
              value={currentForm.values.phone || ''}
              onChange={currentForm.handleChange}
              onBlur={currentForm.handleBlur}
              error={currentForm.errors.phone}
              required
            />

            <FloatingInput
              id="licenseNumber"
              name="licenseNumber"
              type="text"
              label="Pharmacy License Number"
              value={(currentForm.values as any).licenseNumber || ''}
              onChange={currentForm.handleChange}
              onBlur={currentForm.handleBlur}
              error={currentForm.errors.licenseNumber}
              required
            />

            <FileUpload
              label="Upload License Document"
              accept=".pdf,.jpg,.jpeg,.png"
              onFileSelect={(file: File | null) => setLicenseFile(file)}
              error={currentForm.errors.licenseFile}
            />
          </>
        )}

        <FloatingInput
          id="password"
          name="password"
          type="password"
          label="Password"
          value={currentForm.values.password || ''}
          onChange={currentForm.handleChange}
          onBlur={currentForm.handleBlur}
          error={currentForm.errors.password}
          required
        />

        <PasswordStrengthIndicator
          password={currentForm.values.password || ''}
        />

        <FloatingInput
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm Password"
          value={currentForm.values.confirmPassword || ''}
          onChange={currentForm.handleChange}
          onBlur={currentForm.handleBlur}
          error={currentForm.errors.confirmPassword}
          required
        />

        <button
          type="submit"
          disabled={currentForm.isSubmitting}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {currentForm.isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
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
    </AuthLayout>
  );
};
