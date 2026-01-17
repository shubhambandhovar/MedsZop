import { Router } from 'express';
import { InsuranceController } from '../controllers/insuranceController';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Upload insurance policy (requires authentication)
router.post('/upload', authenticate, InsuranceController.uploadPolicy);

// Verify insurance policy (Admin only)
router.post(
  '/verify/:insuranceId',
  authenticate,
  authorize('admin'),
  InsuranceController.verifyPolicy
);

// Check coverage for items (requires authentication)
router.post('/check-coverage/:insuranceId', authenticate, InsuranceController.checkCoverage);

// Get user's insurance policies (requires authentication)
router.get('/user', authenticate, InsuranceController.getUserInsurance);

// Get insurance by ID (requires authentication)
router.get('/:insuranceId', authenticate, InsuranceController.getInsuranceById);

// Get pending verifications (Admin only)
router.get('/pending', authenticate, authorize('admin'), InsuranceController.getPendingVerifications);

// Deactivate insurance (requires authentication)
router.put('/deactivate/:insuranceId', authenticate, InsuranceController.deactivateInsurance);

export default router;
