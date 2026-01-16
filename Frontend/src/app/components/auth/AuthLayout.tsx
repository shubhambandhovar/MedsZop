import React from 'react';
import { Shield, Clock, CheckCircle } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  isDarkMode?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, isDarkMode = false }) => {
  return (
    <div className="min-h-screen">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 transition-colors duration-300">
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-4rem)]">
            
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex flex-col justify-center space-y-8 pr-8">
              {/* Logo and Tagline */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <img
                      src="/assets/M logo1.png"
                      alt="MedsZop"
                      className="w-14 h-14 object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-teal-500 bg-clip-text text-transparent">
                      MedsZop
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Healthcare at your fingertips
                    </p>
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mt-8">
                  Medicine at your doorstep<br />
                  <span className="text-primary-600">in 60 minutes</span>
                </h2>
                
                <p className="text-lg text-gray-600">
                  India's most trusted online pharmacy platform
                </p>
              </div>

              {/* Illustration */}
              <div className="relative">
                <div className="aspect-square max-w-md mx-auto relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-400/20 to-teal-400/20 rounded-3xl blur-3xl"></div>
                  <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
                    <svg viewBox="0 0 400 400" className="w-full h-full">
                      {/* Medical illustration placeholder - simplified */}
                      <circle cx="200" cy="200" r="150" fill="url(#gradient1)" opacity="0.1"/>
                      <path d="M200 100 L200 300 M100 200 L300 200" stroke="currentColor" strokeWidth="20" className="text-primary-500" strokeLinecap="round"/>
                      <circle cx="200" cy="200" r="40" fill="currentColor" className="text-primary-600"/>
                      <defs>
                        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#1E88E5" />
                          <stop offset="100%" stopColor="#2ECC71" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-primary-600" />
                  <p className="text-xs font-semibold text-gray-700">Verified<br />Pharmacies</p>
                </div>
                <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-xs font-semibold text-gray-700">Secure<br />Payments</p>
                </div>
                <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-teal-600" />
                  <p className="text-xs font-semibold text-gray-700">Fast<br />Delivery</p>
                </div>
              </div>
            </div>

            {/* Right Panel - Auth Form */}
            <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-8">
                <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <img
                    src="/assets/M logo1.png"
                    alt="MedsZop"
                    className="w-14 h-14 object-contain"
                  />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-teal-500 bg-clip-text text-transparent">
                  MedsZop
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Medicine at your doorstep in 60 minutes
                </p>
              </div>

              {/* Auth Card */}
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-200/50 overflow-y-auto max-h-[90vh]">
                {children}
              </div>

              {/* Trust Badge Mobile */}
              <div className="lg:hidden flex items-center justify-center gap-2 mt-6 text-xs text-gray-600">
                <Shield className="h-4 w-4" />
                <span>Your data is secure with JWT authentication</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-xs text-gray-500">
            <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </div>
      </div>
    </div>
  );
};
