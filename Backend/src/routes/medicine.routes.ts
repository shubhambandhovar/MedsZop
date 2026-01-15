import { Router } from 'express';
import {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getCategories,
  getPharmacyMedicines,
  createPharmacyMedicine,
  updatePharmacyMedicine,
  deletePharmacyMedicine
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

// Pharmacy-specific routes (for managing pharmacy's own medicines)
router.get('/pharmacy/:pharmacyId', protect, authorize('pharmacy', 'admin'), getPharmacyMedicines);
router.post('/pharmacy/add', protect, authorize('pharmacy'), createPharmacyMedicine);
router.put('/pharmacy/:id', protect, authorize('pharmacy'), updatePharmacyMedicine);
router.delete('/pharmacy/:id', protect, authorize('pharmacy'), deletePharmacyMedicine);

export default router;
