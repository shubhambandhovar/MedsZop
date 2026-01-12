import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getAllOrders
} from '../controllers/orderController';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes are protected
router.use(protect);

// User routes
router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);

// Admin/Pharmacy routes
router.get('/all/orders', authorize('admin', 'pharmacy'), getAllOrders);
router.put('/:id/status', authorize('admin', 'pharmacy'), updateOrderStatus);

export default router;
