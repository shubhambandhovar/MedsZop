import { Router } from 'express';
import {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getCategories
} from '../controllers/medicineController';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', getMedicines);
router.get('/categories', getCategories);
router.get('/:id', getMedicineById);

// Protected routes (Pharmacy & Admin only)
router.post('/', protect, authorize('pharmacy', 'admin'), createMedicine);
router.put('/:id', protect, authorize('pharmacy', 'admin'), updateMedicine);
router.delete('/:id', protect, authorize('admin'), deleteMedicine);

export default router;
