/**
 * useValidation Hook
 * Hook for field-level validation
 */

import { useState, useCallback } from 'react';
import { ValidationUtils } from '../utils/validation';

export function useValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = useCallback((email: string): boolean => {
    const isValid = ValidationUtils.isValidEmail(email);
    
    if (!isValid && email) {
      setErrors(prev => ({
        ...prev,
        email: 'Please enter a valid email address.',
      }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
    }
    
    return isValid;
  }, []);

  const validatePassword = useCallback((password: string): boolean => {
    const isValid = ValidationUtils.isValidPassword(password);
    
    if (!isValid && password) {
      setErrors(prev => ({
        ...prev,
        password: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.',
      }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.password;
        return newErrors;
      });
    }
    
    return isValid;
  }, []);

  const validatePhone = useCallback((phone: string): boolean => {
    const isValid = ValidationUtils.isValidPhone(phone);
    
    if (!isValid && phone) {
      setErrors(prev => ({
        ...prev,
        phone: 'Please enter a valid phone number.',
      }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.phone;
        return newErrors;
      });
    }
    
    return isValid;
  }, []);

  const validateRequired = useCallback((value: string, fieldName: string): boolean => {
    const isValid = value.trim().length > 0;
    
    if (!isValid) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required.`,
      }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
    
    return isValid;
  }, []);

  const clearError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const getPasswordStrength = useCallback((password: string) => {
    return ValidationUtils.getPasswordStrength(password);
  }, []);

  return {
    errors,
    validateEmail,
    validatePassword,
    validatePhone,
    validateRequired,
    clearError,
    clearAllErrors,
    getPasswordStrength,
  };
}
