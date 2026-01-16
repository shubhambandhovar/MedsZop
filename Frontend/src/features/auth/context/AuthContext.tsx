/**
 * AuthContext
 * Global authentication state management
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthState, AuthUser, LoginCredentials, RegisterData } from '../types';
import { AUTH_CONSTANTS } from '../constants';
import { ErrorHandler } from '../utils/errorHandler';
import { authService } from '../../../services/authService';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
  refreshToken: () => Promise<void>;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  /**
   * Initialize auth state from localStorage
   */
  const checkAuth = useCallback(() => {
    try {
      const token = localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN);
      const userStr = localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.USER);

      if (token && userStr) {
        const user = JSON.parse(userStr);
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      ErrorHandler.logError(error, 'AuthContext.checkAuth');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  /**
   * Login user
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authService.login(
        credentials.email,
        credentials.password,
        credentials.role
      );

      if (response.success && response.data) {
        const { user, token } = response.data;
        
        localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.USER, JSON.stringify(user));

        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        ErrorHandler.showSuccess(AUTH_CONSTANTS.SUCCESS.LOGIN);
      } else {
        throw new Error(response.message || AUTH_CONSTANTS.ERRORS.LOGIN_FAILED);
      }
    } catch (error: any) {
      const errorMessage = ErrorHandler.createErrorMessage(error, AUTH_CONSTANTS.ERRORS.LOGIN_FAILED);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      ErrorHandler.showError(errorMessage);
      ErrorHandler.logError(error, 'AuthContext.login');
      throw error;
    }
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(async (data: RegisterData) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authService.register(data);

      if (response.success && response.data) {
        const { user, token } = response.data;
        
        localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.USER, JSON.stringify(user));

        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        ErrorHandler.showSuccess(AUTH_CONSTANTS.SUCCESS.REGISTER);
      } else {
        throw new Error(response.message || AUTH_CONSTANTS.ERRORS.REGISTRATION_FAILED);
      }
    } catch (error: any) {
      const errorMessage = ErrorHandler.createErrorMessage(error, AUTH_CONSTANTS.ERRORS.REGISTRATION_FAILED);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      ErrorHandler.showError(errorMessage);
      ErrorHandler.logError(error, 'AuthContext.register');
      throw error;
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(AUTH_CONSTANTS.STORAGE_KEYS.USER);
    localStorage.removeItem(AUTH_CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN);

    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    ErrorHandler.showSuccess(AUTH_CONSTANTS.SUCCESS.LOGOUT);
  }, []);

  /**
   * Update user data
   */
  const updateUser = useCallback((userData: Partial<AuthUser>) => {
    setState(prev => {
      if (!prev.user) return prev;

      const updatedUser = { ...prev.user, ...userData };
      localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.USER, JSON.stringify(updatedUser));

      return {
        ...prev,
        user: updatedUser,
      };
    });
  }, []);

  /**
   * Refresh authentication token
   */
  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Call refresh token API
      // const response = await authService.refreshToken(refreshToken);
      // Update token in state and localStorage
      
      // For now, just re-check auth
      checkAuth();
    } catch (error) {
      ErrorHandler.logError(error, 'AuthContext.refreshToken');
      logout();
    }
  }, [checkAuth, logout]);

  /**
   * Initialize auth on mount
   */
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Set up token refresh interval
   */
  useEffect(() => {
    if (!state.isAuthenticated) return;

    // Refresh token every 50 minutes (before 1 hour expiry)
    const interval = setInterval(() => {
      refreshToken();
    }, 50 * 60 * 1000);

    return () => clearInterval(interval);
  }, [state.isAuthenticated, refreshToken]);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    refreshToken,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
