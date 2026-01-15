import { Router } from 'express';
import { register, login, getMe, updateProfile, firebaseLogin } from '../controllers/authController';
import { protect } from '../middleware/auth.middleware';
import { firebaseAuth } from '../middleware/firebaseAuth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/firebase-login', firebaseAuth, firebaseLogin);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
