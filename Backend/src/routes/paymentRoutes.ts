import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Create payment order (requires authentication)
router.post('/create-order', authenticate, PaymentController.createOrder);

// Verify payment (requires authentication)
router.post('/verify', authenticate, PaymentController.verifyPayment);

// Razorpay webhook (no authentication - verified by signature)
router.post('/webhook', PaymentController.handleWebhook);

// Get payment by order ID (requires authentication)
router.get('/order/:orderId', authenticate, PaymentController.getPaymentByOrderId);

// Get user payments (requires authentication)
router.get('/user', authenticate, PaymentController.getUserPayments);

export default router;
