const User = require("../models/User");
const Order = require("../models/Order");
const Pharmacy = require("../models/Pharmacy");
const bcrypt = require("bcryptjs");

/**
 * =========================
 * CREATE PHARMACY / DELIVERY USER (ADMIN ONLY)
 * =========================
 */
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role) {
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
      name,
      email,
      password: hashedPassword,
      role,
      phone: phone || ""
    });

    user.password = undefined;
    res.status(201).json(user);

  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ message: "Failed to create user" });
  }
};

/**
 * =========================
 * GET ALL USERS
 * =========================
 */
exports.getUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

/**
 * =========================
 * GET ALL PHARMACIES
 * =========================
 */
exports.getPharmacies = async (req, res) => {
  const pharmacies = await Pharmacy.find();
  res.json(pharmacies);
};

/**
 * =========================
 * VERIFY PHARMACY
 * =========================
 */
exports.verifyPharmacy = async (req, res) => {
  const pharmacy = await Pharmacy.findById(req.params.id);

  if (!pharmacy) {
    return res.status(404).json({ message: "Pharmacy not found" });
  }

  pharmacy.verified = true;
  await pharmacy.save();

  res.json({ message: "Pharmacy verified successfully" });
};

/**
 * =========================
 * ADMIN STATS
 * =========================
 */
exports.stats = async (req, res) => {
  const users_count = await User.countDocuments();
  const pharmacies_count = await Pharmacy.countDocuments();

  const recent_orders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(10);

  const orders_count = recent_orders.length;
  const total_revenue = parseFloat(
    recent_orders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)
  );

  res.json({
    users_count,
    pharmacies_count,
    orders_count,
    total_revenue,
    recent_orders
  });
};
