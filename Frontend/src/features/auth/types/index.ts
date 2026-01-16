/**
 * Auth Feature Types
 * Centralized type definitions for authentication
 */

export type UserRole = 'user' | 'pharmacy' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  addresses?: any[];
  orders?: any[];
  savedPrescriptions?: any[];
  avatar?: string;
  verified?: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role?: UserRole;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  licenseNumber?: string;
  licenseFile?: File;
  gstNumber?: string;
  pharmacyName?: string;
  address?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    token: string;
  };
}

export interface PhoneAuthData {
  phoneNumber: string;
  verificationCode?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [key: string]: string;
}
