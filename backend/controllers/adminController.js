const User = require("../models/User");
const Order = require("../models/Order");
const Pharmacy = require("../models/Pharmacy");
const bcrypt = require("bcryptjs");

// CREATE PHARMACY / DELIVERY USER
exports.createUser = async (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;

    // Validation
    if (!email || !password || !name || !role) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (!["pharmacy", "delivery"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      phone,
      role
    });

    user.password = undefined;

    res.status(201).json(user);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPharmacies = async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find();
    res.json(pharmacies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.verifyPharmacy = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);

    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }

    pharmacy.verified = true;
    await pharmacy.save();

    res.json({ message: "Pharmacy verified successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ADMIN STATS

exports.stats = async (req, res) => {
  try {
    const users_count = await User.countDocuments();
    const pharmacies_count = await Pharmacy.countDocuments();

    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10);

    const orders_count = orders.length;

    const total_revenue = orders.reduce((sum, o) => sum + o.total, 0);

    res.json({
      users_count,
      pharmacies_count,
      orders_count,
      total_revenue,
      recent_orders: orders
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


