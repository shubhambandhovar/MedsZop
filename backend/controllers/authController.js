const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Pharmacy = require("../models/Pharmacy");
const { sendOTPEmail } = require("../utils/emailService");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
/**
 * =========================
 * REGISTER (Customer only)
 * =========================
 */
exports.register = async (req, res) => {
  try {
    const { email, password, name, phone, role: reqRole } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const role = reqRole || "customer";

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      phone,
      role,
    });

    // Create pharmacy document if role is pharmacy
    if (role === "pharmacy") {
      await Pharmacy.create({
        user_id: user._id,
        name: user.name,
        license_number: "",
        address: "",
        verified: false,
        medicines: [],
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" },
    );

    user.password = undefined;

    return res.status(201).json({
      access_token: token,
      user,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * =========================
 * LOGIN (All roles)
 * =========================
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" },
    );

    user.password = undefined;

    return res.json({
      access_token: token,
      user,
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

/**
 * =========================
 * CHANGE PASSWORD
 * =========================
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If first login, skip current password check
    if (!user.is_first_login) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required" });
      }
      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect current password" });
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.is_first_login = false;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * =========================
 * UPDATE PROFILE (Generic)
 * =========================
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;

    // Handle single address update for simple profiles (like Delivery Agent)
    if (address) {
      if (user.addresses && user.addresses.length > 0) {
        user.addresses[0].addressLine1 = address;
      } else {
        user.addresses.push({
          addressLine1: address,
          addressType: "Home", // Default
          name: user.name,
          mobile: user.phone
        });
      }
    }

    await user.save();

    // Return updated user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ message: "Profile updated successfully", user: userResponse });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * =========================
 * GOOGLE OAuth LOGIN (existing users only)
 * =========================
 */
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email. Please sign up first." });
    }

    if (!user.googleId) {
      user.googleId = googleId;
      user.authProvider = "google";
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    user.password = undefined;

    return res.json({ access_token: token, user });
  } catch (err) {
    console.error("Google Login error:", err);
    return res.status(500).json({ message: "Google authentication failed", error: err.message });
  }
};

/**
 * =========================
 * GOOGLE OAuth SIGNUP (new users only)
 * =========================
 */
exports.googleSignup = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ message: "An account with this email already exists. Please sign in instead." });
    }

    user = await User.create({
      email,
      name,
      googleId,
      authProvider: "google",
      role: "customer",
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    user.password = undefined;

    return res.status(201).json({ access_token: token, user });
  } catch (err) {
    console.error("Google Signup error:", err);
    return res.status(500).json({ message: "Google authentication failed", error: err.message });
  }
};

/**
 * =========================
 * FORGOT PASSWORD
 * =========================
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordOtp = otp;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    try {
      await sendOTPEmail(email, otp);
      res.status(200).json({ success: true, message: "OTP sent to email" });
    } catch (err) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: "Email could not be sent", error: err.message });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * =========================
 * VERIFY RESET OTP
 * =========================
 */
exports.verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({
      email,
      resetPasswordOtp: otp,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * =========================
 * RESET PASSWORD
 * =========================
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP and New Password are required" });
    }

    const user = await User.findOne({
      email,
      resetPasswordOtp: otp,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired session" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpire = undefined;
    user.is_first_login = false;

    await user.save();

    res.json({ success: true, message: "Password reset successfully. You can now login." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
