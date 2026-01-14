import { Router } from 'express';
import {
  createAdminUser,
  listAdmins,
  resendAdminInvite,
  setAdminPassword,
  updateAdminPermissions,
  updateAdminStatus
} from '../controllers/adminUserController';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Admin invite acceptance (public)
router.post('/set-password', setAdminPassword);

// Admin management (requires auth)
router.post('/users', protect, authorize('super_admin'), createAdminUser);
router.get('/users', protect, authorize('admin', 'super_admin'), listAdmins);
router.patch('/users/:id/status', protect, authorize('super_admin'), updateAdminStatus);
router.patch('/users/:id/permissions', protect, authorize('super_admin'), updateAdminPermissions);
router.post('/users/:id/resend-invite', protect, authorize('super_admin'), resendAdminInvite);

export default router;
