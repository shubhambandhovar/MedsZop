import express, { Router } from 'express';
import {
  createDoctorConsultation,
  getUserConsultations,
  completeConsultation,
  cancelConsultation,
} from '../controllers/subscriptionController';
import { protect } from '../middleware/auth.middleware';

const router: Router = express.Router();

// Doctor Consultations (Premium Subscription Feature)
router.post('/create', protect, createDoctorConsultation);
router.get('/user/:userId', protect, getUserConsultations);
router.put('/:consultationId/complete', protect, completeConsultation);
router.put('/:consultationId/cancel', protect, cancelConsultation);

export default router;
