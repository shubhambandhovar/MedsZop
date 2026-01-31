const User = require("../models/User");
const Order = require("../models/Order");
const Pharmacy = require("../models/Pharmacy");

// Create new user (admin only)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role
    });

    res.status(201).json({ message: "User created successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Failed to create user", error: err.message });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
};

// Get all pharmacies
exports.getPharmacies = async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find();
    res.json(pharmacies);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pharmacies", error: err.message });
  }
};

// Verify pharmacy
exports.verifyPharmacy = async (req, res) => {
  try {
    const { id } = req.params;
    const pharmacy = await Pharmacy.findByIdAndUpdate(
      id,
      { verified: true },
      { new: true }
    );
    res.json({ message: "Pharmacy verified", pharmacy });
  } catch (err) {
    res.status(500).json({ message: "Failed to verify pharmacy", error: err.message });
  }
};

exports.stats = async (req, res) => {
  try {
    const users_count = await User.countDocuments();
    const pharmacies_count = await Pharmacy.countDocuments();

    const recent_orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10);

    const orders_count = recent_orders.length;

    const total_revenue = recent_orders.reduce(
      (sum, order) => sum + (order.total || 0),
      0
    );

    res.json({
      users_count,
      pharmacies_count,
      orders_count,
      total_revenue,
      recent_orders
    });

  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ message: "Failed to fetch admin stats" });
  }
};