import { Request, Response } from 'express';
import Medicine from '../models/Medicine';

// @desc    Get all medicines
// @route   GET /api/medicines
// @access  Public
export const getMedicines = async (req: Request, res: Response) => {
  try {
    const { 
      search, 
      category, 
      requiresPrescription, 
      inStock,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query: any = {};

    // Text search
    if (search) {
      query.$text = { $search: search as string };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Prescription filter
    if (requiresPrescription !== undefined) {
      query.requiresPrescription = requiresPrescription === 'true';
    }

    // Stock filter
    if (inStock !== undefined) {
      query.inStock = inStock === 'true';
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const medicines = await Medicine.find(query)
      .limit(limitNum)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Medicine.countDocuments(query);

    res.status(200).json({
      success: true,
      count: medicines.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: medicines
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get single medicine by ID
// @route   GET /api/medicines/:id
// @access  Public
export const getMedicineById = async (req: Request, res: Response) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      data: medicine
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Create a new medicine
// @route   POST /api/medicines
// @access  Private/Admin/Pharmacy
export const createMedicine = async (req: Request, res: Response) => {
  try {
    const medicine = await Medicine.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Medicine created successfully',
      data: medicine
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update medicine
// @route   PUT /api/medicines/:id
// @access  Private/Admin/Pharmacy
export const updateMedicine = async (req: Request, res: Response) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Medicine updated successfully',
      data: medicine
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Delete medicine
// @route   DELETE /api/medicines/:id
// @access  Private/Admin
export const deleteMedicine = async (req: Request, res: Response) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get medicine categories
// @route   GET /api/medicines/categories
// @access  Public
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Medicine.distinct('category');

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get medicines for a specific pharmacy
// @route   GET /api/medicines/pharmacy/:pharmacyId
// @access  Private/Pharmacy
export const getPharmacyMedicines = async (req: Request, res: Response) => {
  try {
    const { pharmacyId } = req.params;
    const { search, category, page = 1, limit = 50 } = req.query;

    const query: any = { pharmacyId };

    if (search) {
      query.$or = [
        { brand: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const medicines = await Medicine.find(query)
      .limit(limitNum)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Medicine.countDocuments(query);

    res.status(200).json({
      success: true,
      count: medicines.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: medicines
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Create medicine for pharmacy
// @route   POST /api/medicines/pharmacy/add
// @access  Private/Pharmacy
export const createPharmacyMedicine = async (req: Request, res: Response) => {
  try {
    const { pharmacyId, ...medicineData } = req.body;

    if (!pharmacyId) {
      return res.status(400).json({
        success: false,
        message: 'Pharmacy ID is required'
      });
    }

    const medicine = await Medicine.create({
      ...medicineData,
      pharmacyId
    });

    res.status(201).json({
      success: true,
      message: 'Medicine added to inventory successfully',
      data: medicine
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update pharmacy medicine
// @route   PUT /api/medicines/pharmacy/:id
// @access  Private/Pharmacy
export const updatePharmacyMedicine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pharmacyId, ...updateData } = req.body;

    // Verify medicine belongs to pharmacy
    const medicine = await Medicine.findById(id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    if (pharmacyId && medicine.pharmacyId?.toString() !== pharmacyId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this medicine'
      });
    }

    const updated = await Medicine.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Medicine updated successfully',
      data: updated
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Delete pharmacy medicine
// @route   DELETE /api/medicines/pharmacy/:id
// @access  Private/Pharmacy
export const deletePharmacyMedicine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pharmacyId } = req.body;

    const medicine = await Medicine.findById(id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    if (pharmacyId && medicine.pharmacyId?.toString() !== pharmacyId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this medicine'
      });
    }

    await Medicine.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
