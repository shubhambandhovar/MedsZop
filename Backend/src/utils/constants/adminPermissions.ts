export const ADMIN_PERMISSIONS = [
  'users',
  'pharmacies',
  'orders',
  'prescriptions',
  'subscriptions',
  'analytics'
] as const;

export type AdminPermission = typeof ADMIN_PERMISSIONS[number];
