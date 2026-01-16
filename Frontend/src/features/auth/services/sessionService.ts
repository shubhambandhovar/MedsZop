/**
 * Session Management Service
 * Handle user session lifecycle
 */

import { AUTH_CONSTANTS } from '../constants';
import { AuthUser } from '../types';
import { TokenService } from './tokenService';
import { ErrorHandler } from '../utils/errorHandler';

export class SessionService {
  /**
   * Save user session
   */
  static saveSession(user: AuthUser, token: string, refreshToken?: string): void {
    try {
      TokenService.saveTokens(token, refreshToken);
      localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.USER, JSON.stringify(user));
      
      // Set session timestamp
      localStorage.setItem('sessionStartTime', Date.now().toString());
    } catch (error) {
      ErrorHandler.logError(error, 'SessionService.saveSession');
      throw error;
    }
  }

  /**
   * Get current user from session
   */
  static getCurrentUser(): AuthUser | null {
    try {
      const userStr = localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.USER);
      
      if (!userStr) {
        return null;
      }

      return JSON.parse(userStr);
    } catch (error) {
      ErrorHandler.logError(error, 'SessionService.getCurrentUser');
      return null;
    }
  }

  /**
   * Update user in session
   */
  static updateUser(userData: Partial<AuthUser>): void {
    try {
      const currentUser = this.getCurrentUser();
      
      if (!currentUser) {
        throw new Error('No active session');
      }

      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    } catch (error) {
      ErrorHandler.logError(error, 'SessionService.updateUser');
      throw error;
    }
  }

  /**
   * Clear user session
   */
  static clearSession(): void {
    TokenService.clearTokens();
    localStorage.removeItem(AUTH_CONSTANTS.STORAGE_KEYS.USER);
    localStorage.removeItem('sessionStartTime');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('savedEmail');
  }

  /**
   * Check if session is valid
   */
  static isSessionValid(): boolean {
    const user = this.getCurrentUser();
    const token = TokenService.getAccessToken();

    if (!user || !token) {
      return false;
    }

    // Check if token is expired
    if (TokenService.isTokenExpired()) {
      return false;
    }

    return true;
  }

  /**
   * Get session duration in minutes
   */
  static getSessionDuration(): number {
    const startTimeStr = localStorage.getItem('sessionStartTime');
    
    if (!startTimeStr) {
      return 0;
    }

    const startTime = parseInt(startTimeStr, 10);
    const duration = Date.now() - startTime;
    
    return Math.floor(duration / (60 * 1000));
  }

  /**
   * Check if remember me is enabled
   */
  static isRememberMeEnabled(): boolean {
    return localStorage.getItem('rememberMe') === 'true';
  }

  /**
   * Get saved email
   */
  static getSavedEmail(): string | null {
    if (!this.isRememberMeEnabled()) {
      return null;
    }

    return localStorage.getItem('savedEmail');
  }

  /**
   * Set remember me
   */
  static setRememberMe(email: string, remember: boolean): void {
    if (remember) {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('savedEmail', email);
    } else {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('savedEmail');
    }
  }

  /**
   * Refresh session
   */
  static async refreshSession(): Promise<boolean> {
    try {
      const refreshToken = TokenService.getRefreshToken();
      
      if (!refreshToken) {
        return false;
      }

      // Call refresh token API
      // const response = await authService.refreshToken(refreshToken);
      // TokenService.saveTokens(response.data.token, response.data.refreshToken);
      
      // For now, just validate existing session
      return this.isSessionValid();
    } catch (error) {
      ErrorHandler.logError(error, 'SessionService.refreshSession');
      this.clearSession();
      return false;
    }
  }
}
