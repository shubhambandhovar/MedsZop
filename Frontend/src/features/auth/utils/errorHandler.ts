/**
 * Error Handling Utilities
 * Centralized error handling for auth feature
 */

import { toast } from 'sonner';
import { AUTH_CONSTANTS } from '../constants';

export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ErrorHandler {
  /**
   * Handle API errors
   */
  static handleApiError(error: any): string {
    // Network error
    if (!error.response) {
      return AUTH_CONSTANTS.ERRORS.NETWORK;
    }

    const { status, data } = error.response;

    // Handle specific status codes
    switch (status) {
      case 401:
        this.handleUnauthorized();
        return AUTH_CONSTANTS.ERRORS.UNAUTHORIZED;
      
      case 400:
        return data?.message || 'Invalid request. Please check your input.';
      
      case 403:
        return 'Access denied. You do not have permission to perform this action.';
      
      case 404:
        return 'Resource not found.';
      
      case 409:
        return data?.message || 'This email is already registered.';
      
      case 422:
        return data?.message || 'Validation error. Please check your input.';
      
      case 429:
        return 'Too many requests. Please try again later.';
      
      case 500:
      case 502:
      case 503:
        return 'Server error. Please try again later.';
      
      default:
        return data?.message || 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Handle unauthorized access
   */
  static handleUnauthorized(): void {
    // Clear auth data
    localStorage.removeItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(AUTH_CONSTANTS.STORAGE_KEYS.USER);
    localStorage.removeItem(AUTH_CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN);
    
    // Redirect to login
    window.location.href = AUTH_CONSTANTS.ROUTES.LOGIN;
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(errors: any): string {
    if (typeof errors === 'string') {
      return errors;
    }

    if (Array.isArray(errors)) {
      return errors.map(err => err.message || err).join(', ');
    }

    if (typeof errors === 'object') {
      const messages = Object.values(errors).filter(Boolean);
      return messages.join(', ');
    }

    return 'Validation error occurred.';
  }

  /**
   * Display error toast
   */
  static showError(message: string, duration: number = 4000): void {
    toast.error(message, {
      duration,
      position: 'top-right',
    });
  }

  /**
   * Display success toast
   */
  static showSuccess(message: string, duration: number = 3000): void {
    toast.success(message, {
      duration,
      position: 'top-right',
    });
  }

  /**
   * Log error for debugging
   */
  static logError(error: any, context?: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${context || 'Error'}]:`, error);
    }

    // In production, you might want to send errors to a logging service
    // Example: Sentry.captureException(error);
  }

  /**
   * Create user-friendly error message
   */
  static createErrorMessage(error: any, fallback?: string): string {
    if (error instanceof AuthError) {
      return error.message;
    }

    if (error?.response) {
      return this.handleApiError(error);
    }

    if (error?.message) {
      return error.message;
    }

    return fallback || 'An unexpected error occurred.';
  }
}
