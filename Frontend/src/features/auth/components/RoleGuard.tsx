/**
 * RoleGuard Component
 * Higher-order component for role-based access control
 */

import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ROLE_PERMISSIONS } from '../constants';

type Permission = typeof ROLE_PERMISSIONS[keyof typeof ROLE_PERMISSIONS][number];

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: Permission;
  fallback?: ReactNode;
}

export function RoleGuard({
  children,
  allowedRoles,
  requiredPermission,
  fallback = null,
}: RoleGuardProps) {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  // Check permission-based access
  if (requiredPermission) {
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    if (!(userPermissions as readonly string[]).includes(requiredPermission)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

/**
 * Hook for checking permissions
 */
export function usePermission() {
  const { user } = useAuth();

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return (userPermissions as readonly string[]).includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  return {
    user,
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
