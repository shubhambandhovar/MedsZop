import React from 'react';
import { Shield, Clock, CheckCircle } from 'lucide-react';

/**
 * ⚠️ CRITICAL: LOCKED LOGIN PAGE DESIGN - DO NOT MODIFY ⚠️
 * 
 * This component uses INLINE STYLES with exact hex colors to maintain
 * the approved dark mode design. All styles are LOCKED and must remain
 * pixel-identical to the approved design.
 * 
 * 🚫 DO NOT:
 * - Add or modify any dark: responsive classes
 * - Change any inline style colors (hex values are exact)
 * - Remove the isolation: 'isolate' property
 * - Apply global theme classes or variables
 * - Refactor to use Tailwind dark mode utilities
 * - Extract styles to CSS modules or external files
 * 
 * ✅ WHY LOCKED:
 * - Approved design must remain unchanged
 * - Global theme changes must NOT affect login page
 * - Inline styles prevent cascade from theme system
 * - isolation property creates independent stacking context
 * 
 * 📋 APPROVED COLOR PALETTE (DO NOT CHANGE):
 * - Background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e3a8a 100%)
 * - Card: rgba(30, 41, 59, 0.9)
 * - Primary text: #f8fafc (white)
 * - Secondary text: #cbd5e1 (light gray)
 * - Tertiary text: #94a3b8 (medium gray)
 * - Accent blue: #60a5fa
 * - Accent green: #4ade80
 * - Accent teal: #14b8a6
 * - Borders: rgba(71, 85, 105, 0.5-0.6)
 * 
 * If you need to make changes, consult the project lead first.
 */

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen" style={{ isolation: 'isolate' }}>
      {/* 
        ⚠️ LOCKED BACKGROUND GRADIENT - DO NOT MODIFY ⚠️
        This exact gradient is the approved design. Any changes will break the locked theme.
        Colors: #1e293b (slate-800) → #334155 (slate-700) → #1e3a8a (blue-800)
        The isolation property prevents global theme cascade.
      */}
      <div className="min-h-screen" style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e3a8a 100%)',
        isolation: 'isolate'
      }}>
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
                    <h1 className="text-4xl font-bold" style={{
                      background: 'linear-gradient(to right, #3b82f6, #14b8a6)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      MedsZop
                    </h1>
                    <p style={{ color: '#94a3b8' }} className="text-sm">
                      Healthcare at your fingertips
                    </p>
                  </div>
                </div>

                <h2 className="text-3xl font-bold mt-8" style={{ color: '#f8fafc' }}>
                  Medicine at your doorstep<br />
                  <span style={{ color: '#60a5fa' }}>in 60 minutes</span>
                </h2>
                
                <p className="text-lg" style={{ color: '#cbd5e1' }}>
                  India's most trusted online pharmacy platform
                </p>
              </div>

              {/* Illustration */}
              <div className="relative">
                <div className="aspect-square max-w-md mx-auto relative">
                  <div className="absolute inset-0 rounded-3xl blur-3xl" style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(20, 184, 166, 0.2))'
                  }}></div>
                  <div className="relative backdrop-blur-sm rounded-3xl p-8 shadow-xl" style={{
                    backgroundColor: 'rgba(51, 65, 85, 0.8)'
                  }}>
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
                <div className="text-center p-4 backdrop-blur-sm rounded-xl" style={{ backgroundColor: 'rgba(51, 65, 85, 0.6)' }}>
                  <Shield className="h-8 w-8 mx-auto mb-2" style={{ color: '#60a5fa' }} />
                  <p className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>Verified<br />Pharmacies</p>
                </div>
                <div className="text-center p-4 backdrop-blur-sm rounded-xl" style={{ backgroundColor: 'rgba(51, 65, 85, 0.6)' }}>
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" style={{ color: '#4ade80' }} />
                  <p className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>Secure<br />Payments</p>
                </div>
                <div className="text-center p-4 backdrop-blur-sm rounded-xl" style={{ backgroundColor: 'rgba(51, 65, 85, 0.6)' }}>
                  <Clock className="h-8 w-8 mx-auto mb-2" style={{ color: '#14b8a6' }} />
                  <p className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>Fast<br />Delivery</p>
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
                <h1 className="text-3xl font-bold" style={{
                  background: 'linear-gradient(to right, #3b82f6, #14b8a6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  MedsZop
                </h1>
                <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
                  Medicine at your doorstep in 60 minutes
                </p>
              </div>

              {/* Auth Card - LOCKED STYLES */}
              <div className="backdrop-blur-xl rounded-2xl shadow-2xl p-8 overflow-y-auto max-h-[90vh]" style={{
                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(71, 85, 105, 0.5)'
              }}>
                {children}
              </div>

              {/* Trust Badge Mobile */}
              <div className="lg:hidden flex items-center justify-center gap-2 mt-6 text-xs" style={{ color: '#94a3b8' }}>
                <Shield className="h-4 w-4" />
                <span>Your data is secure with JWT authentication</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-xs" style={{ color: '#94a3b8' }}>
            <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </div>
      </div>
    </div>
  );
};
