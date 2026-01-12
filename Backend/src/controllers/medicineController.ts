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
