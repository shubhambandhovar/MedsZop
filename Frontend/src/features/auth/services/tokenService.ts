/**
 * Token Management Service
 * Handle token storage, refresh, and validation
 */

import { AUTH_CONSTANTS } from '../constants';
import { ErrorHandler } from '../utils/errorHandler';

export class TokenService {
  /**
   * Save tokens to localStorage
   */
  static saveTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN, accessToken);
    
    if (refreshToken) {
      localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }

    // Set token expiry timestamp
    const expiryTime = Date.now() + AUTH_CONSTANTS.TOKEN_EXPIRY.ACCESS_TOKEN;
    localStorage.setItem('tokenExpiry', expiryTime.toString());
  }

  /**
   * Get access token
   */
  static getAccessToken(): string | null {
    return localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN);
  }

  /**
   * Get refresh token
   */
  static getRefreshToken(): string | null {
    return localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(): boolean {
    const expiryStr = localStorage.getItem('tokenExpiry');
    
    if (!expiryStr) {
      return true;
    }

    const expiry = parseInt(expiryStr, 10);
    return Date.now() > expiry;
  }

  /**
   * Check if token needs refresh (within 5 minutes of expiry)
   */
  static shouldRefreshToken(): boolean {
    const expiryStr = localStorage.getItem('tokenExpiry');
    
    if (!expiryStr) {
      return false;
    }

    const expiry = parseInt(expiryStr, 10);
    const timeUntilExpiry = expiry - Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    return timeUntilExpiry < fiveMinutes && timeUntilExpiry > 0;
  }

  /**
   * Clear all tokens
   */
  static clearTokens(): void {
    localStorage.removeItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(AUTH_CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem('tokenExpiry');
  }

  /**
   * Decode JWT token
   */
  static decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      ErrorHandler.logError(error, 'TokenService.decodeToken');
      return null;
    }
  }

  /**
   * Get token payload
   */
  static getTokenPayload(): any {
    const token = this.getAccessToken();
    
    if (!token) {
      return null;
    }

    return this.decodeToken(token);
  }

  /**
   * Get user ID from token
   */
  static getUserIdFromToken(): string | null {
    const payload = this.getTokenPayload();
    return payload?.userId || payload?.id || null;
  }

  /**
   * Get user role from token
   */
  static getUserRoleFromToken(): string | null {
    const payload = this.getTokenPayload();
    return payload?.role || null;
  }

  /**
   * Validate token format
   */
  static isValidTokenFormat(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3;
  }
}
