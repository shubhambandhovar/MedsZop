/**
 * Auth Feature - Main Export
 * Clean imports for the entire auth feature
 */

// Context
export { AuthProvider, useAuth } from './context/AuthContext';

// Components
export { ProtectedRoute, RoleGuard, ErrorBoundary, usePermission } from './components';

// Hooks
export { useForm, useValidation } from './hooks';

// Utils
export { ValidationUtils, ErrorHandler, AuthError } from './utils';

// Types
export type {
  UserRole,
  AuthUser,
  AuthState,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  PhoneAuthData,
  ValidationError,
  FormErrors,
} from './types';

// Constants
export { AUTH_CONSTANTS, ROLE_PERMISSIONS } from './constants';
