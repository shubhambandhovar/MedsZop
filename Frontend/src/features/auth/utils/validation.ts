/**
 * Validation Utilities
 * Reusable validation functions for forms
 */

import { AUTH_CONSTANTS } from '../constants';
import { FormErrors } from '../types';

export class ValidationUtils {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    return AUTH_CONSTANTS.PATTERNS.EMAIL.test(email);
  }

  /**
   * Validate phone number
   */
  static isValidPhone(phone: string): boolean {
    // Remove all non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's an Indian phone number (10 digits starting with 6-9)
    if (cleanPhone.length === 10) {
      return AUTH_CONSTANTS.PATTERNS.INDIAN_PHONE.test(cleanPhone);
    }
    
    // Otherwise use general phone pattern
    return AUTH_CONSTANTS.PATTERNS.PHONE.test(phone);
  }

  /**
   * Calculate password strength
   */
  static getPasswordStrength(password: string): {
    score: number;
    label: 'weak' | 'medium' | 'strong' | 'very-strong';
    feedback: string[];
  } {
    let score = 0;
    const feedback: string[] = [];

    if (!password) {
      return { score: 0, label: 'weak', feedback: ['Password is required'] };
    }

    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('At least 8 characters');

    if (password.length >= 12) score += 1;

    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Include numbers');

    if (/[@$!%*?&]/.test(password)) score += 1;
    else feedback.push('Include special characters (@$!%*?&)');

    // Determine label
    let label: 'weak' | 'medium' | 'strong' | 'very-strong';
    if (score <= 2) label = 'weak';
    else if (score <= 4) label = 'medium';
    else if (score <= 5) label = 'strong';
    else label = 'very-strong';

    return { score, label, feedback };
  }

  /**
   * Validate password meets requirements
   */
  static isValidPassword(password: string): boolean {
    const { MIN_LENGTH, REQUIRE_UPPERCASE, REQUIRE_LOWERCASE, REQUIRE_NUMBER, REQUIRE_SPECIAL } =
      AUTH_CONSTANTS.PASSWORD;

    if (password.length < MIN_LENGTH) return false;
    if (REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) return false;
    if (REQUIRE_LOWERCASE && !/[a-z]/.test(password)) return false;
    if (REQUIRE_NUMBER && !/\d/.test(password)) return false;
    if (REQUIRE_SPECIAL && !/[@$!%*?&]/.test(password)) return false;

    return true;
  }

  /**
   * Validate login form
   */
  static validateLoginForm(email: string, password: string): FormErrors {
    const errors: FormErrors = {};

    if (!email.trim()) {
      errors.email = AUTH_CONSTANTS.ERRORS.EMAIL_REQUIRED;
    } else if (!this.isValidEmail(email)) {
      errors.email = AUTH_CONSTANTS.ERRORS.INVALID_EMAIL;
    }

    if (!password) {
      errors.password = AUTH_CONSTANTS.ERRORS.PASSWORD_REQUIRED;
    }

    return errors;
  }

  /**
   * Validate registration form
   */
  static validateRegistrationForm(data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: string;
    licenseNumber?: string;
    pharmacyName?: string;
  }): FormErrors {
    const errors: FormErrors = {};

    // Name validation
    if (!data.name.trim()) {
      errors.name = 'Name is required.';
    } else if (data.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    // Email validation
    if (!data.email.trim()) {
      errors.email = AUTH_CONSTANTS.ERRORS.EMAIL_REQUIRED;
    } else if (!this.isValidEmail(data.email)) {
      errors.email = AUTH_CONSTANTS.ERRORS.INVALID_EMAIL;
    }

    // Password validation
    if (!data.password) {
      errors.password = AUTH_CONSTANTS.ERRORS.PASSWORD_REQUIRED;
    } else if (data.password.length < AUTH_CONSTANTS.PASSWORD.MIN_LENGTH) {
      errors.password = AUTH_CONSTANTS.ERRORS.PASSWORD_TOO_SHORT;
    } else if (!this.isValidPassword(data.password)) {
      errors.password = AUTH_CONSTANTS.ERRORS.PASSWORD_WEAK;
    }

    // Phone validation
    if (!data.phone.trim()) {
      errors.phone = 'Phone number is required.';
    } else if (!this.isValidPhone(data.phone)) {
      errors.phone = AUTH_CONSTANTS.ERRORS.INVALID_PHONE;
    }

    // Pharmacy-specific validation
    if (data.role === 'pharmacy') {
      if (!data.licenseNumber?.trim()) {
        errors.licenseNumber = 'License number is required for pharmacy registration.';
      }
      if (!data.pharmacyName?.trim()) {
        errors.pharmacyName = 'Pharmacy name is required.';
      }
    }

    return errors;
  }

  /**
   * Sanitize input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  /**
   * Format phone number for display
   */
  static formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    
    return phone;
  }

  /**
   * Check if form has errors
   */
  static hasErrors(errors: FormErrors): boolean {
    return Object.keys(errors).length > 0;
  }
}
