const Order = require("../models/Order");
const User = require("../models/User");
const Medicine = require("../models/Medicine");
const Pharmacy = require("../models/Pharmacy");
const mongoose = require("mongoose");

// CREATE ORDER
exports.createOrder = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      console.error(`❌ User not found for ID: ${req.user.id}`);
      return res.status(401).json({ message: "User not found. Please log in again." });
    }

    if (!user.cart || !user.cart.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const { address_id, payment_method } = req.body;

    // Find the actual address object from user's addresses
    const address = user.addresses.find(
      (addr) => addr._id && addr._id.toString() === address_id
    );

    if (!address) {
      console.error(`❌ Address ID ${address_id} not found for user ${user._id}`);
      return res.status(400).json({ message: "Invalid delivery address. Please re-select your address." });
    }

    console.log(`📦 Creating order with ${user.cart.length} items...`);

    let items = [];
    let total = 0;
    let pharmacyId = null;

    for (let cartItem of user.cart) {
      if (!cartItem.medicine_id || cartItem.medicine_id === "undefined") {
        console.warn("⚠️ Skipping invalid cart item:", cartItem);
        continue;
      }
      // 1. Try Global Medicine
      let medicine = null;
      if (mongoose.Types.ObjectId.isValid(cartItem.medicine_id)) {
        medicine = await Medicine.findById(cartItem.medicine_id).lean();
      }

      // 2. Try Pharmacy Medicine
      if (!medicine) {
        try {
          const pharmacy = await Pharmacy.findOne(
            { "medicines._id": cartItem.medicine_id },
            { "medicines.$": 1, name: 1 }
          );
          if (pharmacy && pharmacy.medicines && pharmacy.medicines.length > 0) {
            const m = pharmacy.medicines[0];
            medicine = {
              _id: m._id,
              name: m.name,
              price: m.price || 0,
              discount_price: (m.mrp && m.mrp > m.price) ? m.price : null,
              pharmacy_id: pharmacy._id
            };
          }
        } catch (e) {
          console.error(`Error looking up pharmacy medicine ${cartItem.medicine_id}:`, e.message);
        }
      }

      if (!medicine) {
        console.error(`❌ Medicine with ID ${cartItem.medicine_id} not found in global or pharmacy stocks.`);
        return res.status(400).json({ message: `Medicine not found: ${cartItem.medicine_id}. Please clear your cart and try again.` });
      }

      const price = Number(medicine.discount_price || medicine.price || 0);

      if (isNaN(price)) {
        console.error(`❌ Invalid price for medicine ${medicine.name}: ${price}`);
        return res.status(400).json({ message: `Invalid price for ${medicine.name}` });
      }

      // Set the pharmacy_id for the whole order if not set
      if (!pharmacyId && medicine.pharmacy_id) {
        pharmacyId = medicine.pharmacy_id.toString();
      }

      items.push({
        medicine_id: medicine._id.toString(),
        name: medicine.name,
        price,
        quantity: cartItem.quantity
      });

      total += price * cartItem.quantity;
    }

    const order = await Order.create({
      user_id: user._id,
      pharmacy_id: pharmacyId,
      items,
      total,
      address,
      payment_method: payment_method || "cod",
      order_status: "pending",
      payment_status: payment_method === "cod" ? "pending" : "processing",
      status_history: [{ status: "pending", timestamp: new Date() }],
      orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    });

    // Clear cart
    user.cart = [];
    await user.save();

    res.status(201).json({
      message: "Order placed successfully",
      order_id: order._id,
      order
    });

  } catch (err) {
    console.error("Create Order Fatal Error:", err);
    res.status(500).json({
      message: "Order placement failed on server",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  }
};


// GET USER ORDERS
exports.getOrders = async (req, res) => {

  try {

    const orders = await Order.find({ user_id: req.user.id })
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// GET SINGLE ORDER
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Ensure user can only see their own order
    if (order.user_id !== req.user.id && req.user.role === "customer") {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE ORDER STATUS (Admin / Pharmacy / Delivery)
exports.updateOrderStatus = async (req, res) => {

  try {

    const order = await Order.findById(req.params.id);

    if (!order)
      return res.status(404).json({ message: "Order not found" });

    order.order_status = req.body.status;

    // 🔥 AUTO-ASSIGN PHARMACY: If a pharmacy confirms an unassigned order, claim it
    if (req.user.role === "pharmacy" && req.body.status === "confirmed") {
      const pharmacy = await Pharmacy.findOne({ user_id: req.user.id });
      if (pharmacy && (!order.pharmacy_id || order.pharmacy_id === "")) {
        order.pharmacy_id = pharmacy._id.toString();
        // Generate 4-digit OTP for delivery
        order.delivery_otp = Math.floor(1000 + Math.random() * 9000).toString();
      }
    }

    order.status_history.push({
      status: req.body.status,
      timestamp: new Date()
    });

    await order.save();

    res.json({ message: "Status updated" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
