import express, { Router } from 'express';
import {
  getSubscriptionPlans,
  createSubscriptionPlan,
  getUserSubscription,
  createSubscription,
  updateSubscriptionMedicines,
  pauseSubscription,
  resumeSubscription,
  skipSubscriptionMonth,
  cancelSubscription,
  processSubscriptionBillings,
} from '../controllers/subscriptionController';
import { protect, authorize } from '../middleware/auth.middleware';

const router: Router = express.Router();

// Subscription Plans
router.get('/plans', getSubscriptionPlans);
router.post('/plans', protect, authorize('admin'), createSubscriptionPlan); // Admin only

// User Subscriptions
router.get('/user/:userId', protect, getUserSubscription);
router.post('/create', protect, createSubscription);
router.put('/:subscriptionId/medicines', protect, updateSubscriptionMedicines);
router.put('/:subscriptionId/pause', protect, pauseSubscription);
router.put('/:subscriptionId/resume', protect, resumeSubscription);
router.put('/:subscriptionId/skip-month', protect, skipSubscriptionMonth);
router.put('/:subscriptionId/cancel', protect, cancelSubscription);

// Billing Cron
router.post('/cron/process-billings', processSubscriptionBillings);

export default router;
