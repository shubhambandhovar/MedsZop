import { Request, Response } from 'express';
import Order from '../models/Order';
import Medicine from '../models/Medicine';

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req: Request, res: Response) => {
  try {
    const {
      items,
      deliveryAddress,
      paymentMethod,
      prescriptionId
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items provided'
      });
    }

    // Calculate total and check prescription requirements
    let total = 0;
    let prescriptionRequired = false;

    for (const item of items) {
      const medicine = await Medicine.findById(item.medicineId);
      
      if (!medicine) {
        return res.status(404).json({
          success: false,
          message: `Medicine with ID ${item.medicineId} not found`
        });
      }

      if (medicine.requiresPrescription) {
        prescriptionRequired = true;
      }

      total += medicine.price * item.quantity;
    }

    // Check if prescription is provided when required
    if (prescriptionRequired && !prescriptionId) {
      return res.status(400).json({
        success: false,
        message: 'Prescription required for one or more items in this order'
      });
    }

    // Create order
    const order = await Order.create({
      userId: req.user?._id,
      items,
      total,
      deliveryAddress,
      paymentMethod,
      prescriptionRequired,
      prescriptionId,
      prescriptionVerified: prescriptionId ? false : true
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get all orders for logged in user
// @route   GET /api/orders
// @access  Private
export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ userId: req.user?._id })
      .populate('prescriptionId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('prescriptionId')
      .populate('items.medicineId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Make sure user owns this order or is admin/pharmacy
    if (
      order.userId.toString() !== req.user?._id.toString() &&
      req.user?.role !== 'admin' &&
      req.user?.role !== 'pharmacy'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Pharmacy/Admin
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    const validStatuses = ['confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Make sure user owns this order
    if (order.userId.toString() !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}`
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get all orders (Admin/Pharmacy)
// @route   GET /api/orders/all
// @access  Private/Admin/Pharmacy
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query: any = {};
    
    if (status) {
      query.status = status;
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .populate('prescriptionId')
      .limit(limitNum)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: orders
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
