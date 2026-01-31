const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * =========================
 * REGISTER (Customer only)
 * =========================
 */
exports.register = async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

<<<<<<< HEAD
    // ✅ Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
=======
    if (!email || !password || !name || !phone) {
      return res.status(400).json({ message: "All required fields missing" });
>>>>>>> 46e45db1aea87aa1bffa24d2cd6bcd16a28d9e49
    }

    // ✅ Check existing user
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({
        message: "Email already registered"
      });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ FORCE customer role
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      phone,
      role: "customer"
<<<<<<< HEAD
=======

>>>>>>> 46e45db1aea87aa1bffa24d2cd6bcd16a28d9e49
    });

    // ✅ Create JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    user.password = undefined;

    return res.status(201).json({
      access_token: token,
      user
    });

  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * =========================
 * LOGIN
 * =========================
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required"
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    user.password = undefined;

    return res.json({
      access_token: token,
      user
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * =========================
 * GET CURRENT USER (/auth/me)
 * =========================
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
