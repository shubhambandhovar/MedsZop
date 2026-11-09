const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Pharmacy = require("../models/Pharmacy");
const { sendOTPEmail, sendWelcomeEmail } = require("../utils/emailService");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Server-secret key for HMAC OTP hashing (SEC-06 / Phase 9B.1)
 */
const getOTPSecret = () => {
  return process.env.OTP_SECRET || process.env.JWT_SECRET || "medszop_secure_otp_server_secret_key_2026";
};

/**
 * Hash an OTP using HMAC-SHA256 with server-secret key for cryptographically secure storage (SEC-06 / Phase 9B.1)
 * Prevents offline pre-computation or rainbow-table cracking of 6-digit OTPs in case of database leakage.
 */
const hashOTP = (otp) => {
  return crypto.createHmac("sha256", getOTPSecret()).update(otp.toString().trim()).digest("hex");
};

/**
 * Timing-safe comparison of stored hash with incoming OTP
 */
const verifyHashedOTP = (storedHash, inputOtp) => {
  if (!storedHash || !inputOtp) return false;
  const inputHash = hashOTP(inputOtp);
  try {
    const bufA = Buffer.from(storedHash, "hex");
    const bufB = Buffer.from(inputHash, "hex");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
};

// In-memory cooldown tracker for forgot-password requests (rate limiting)
const forgotPasswordCooldowns = new Map();

/**
 * =========================
 * REGISTER (Customer only)
 * =========================
 */
exports.register = async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

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

    // SEC-01 Remediation: Public registration MUST strictly enforce customer role.
    // Privileged accounts (admin, doctor, pharmacy, delivery) can only be provisioned
    // through authorized administrative onboarding (/api/admin/create-user or /api/onboarding/admin/review).
    const role = "customer";

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      phone,
      role,
    });

    // WELCOME EMAIL (Customers)
    try {
      if (!user.welcomeEmailSent) {
        await sendWelcomeEmail(user.email, user.name);
        user.welcomeEmailSent = true;
        await user.save();
      }
    } catch (emailErr) {
      console.error("Welcome email failed:", emailErr.message);
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

    // WELCOME EMAIL (Customers)
    try {
      if (!user.welcomeEmailSent) {
        await sendWelcomeEmail(user.email, user.name);
        user.welcomeEmailSent = true;
        await user.save();
      }
    } catch (emailErr) {
      console.error("Welcome email failed:", emailErr.message);
    }

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
 * FORGOT PASSWORD (SEC-06)
 * =========================
 * - CSPRNG 6-digit OTP generation
 * - SHA-256 hashed OTP storage
 * - Account enumeration mitigation (generic 200 message)
 * - 10-minute short-lived expiry
 * - Attempt counter reset
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Mitigation for User Enumeration:
    // Always return generic success so attackers cannot probe for registered emails.
    const genericResponse = {
      success: true,
      message: "If that email address is registered, a 6-digit verification code has been sent."
    };

    // Rate Limiting: 60-second cooldown per email to prevent flooding
    const lastRequest = forgotPasswordCooldowns.get(normalizedEmail);
    if (lastRequest && Date.now() - lastRequest < 60000) {
      return res.status(200).json(genericResponse);
    }
    forgotPasswordCooldowns.set(normalizedEmail, Date.now());

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Generate cryptographically secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = hashOTP(otp);

    user.resetPasswordOtp = hashedOtp;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.resetPasswordAttempts = 0;
    await user.save();

    try {
      await sendOTPEmail(normalizedEmail, otp);
      return res.status(200).json(genericResponse);
    } catch (err) {
      console.error("[Email] Failed to send reset OTP email:", err.message);
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpire = undefined;
      user.resetPasswordAttempts = 0;
      await user.save();
      return res.status(500).json({ message: "Email could not be sent. Please try again later." });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * ============================================================
 * VERIFY RESET OTP (SEC-06 / Phase 9B.1)
 * ============================================================
 * - Timing-safe HMAC-SHA256 hash comparison with server secret
 * - Atomic attempt increment & race-condition lockout ($lt: 5 guard)
 * - Immediate invalidation upon 5th failed attempt (HTTP 429)
 * - Short-lived expiry check
 */
exports.verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Atomic query to check and increment attempt counter.
    // If attempts are already >= 5, findOneAndUpdate will fail the atomic $lt: 5 guard.
    const user = await User.findOneAndUpdate(
      {
        email: normalizedEmail,
        resetPasswordOtp: { $exists: true, $ne: null },
        resetPasswordExpire: { $gt: Date.now() },
        resetPasswordAttempts: { $lt: 5 }
      },
      {
        $inc: { resetPasswordAttempts: 1 }
      },
      {
        new: true
      }
    );

    if (!user) {
      // Check if user hit the lockout threshold (>= 5 attempts)
      const lockedUser = await User.findOne({
        email: normalizedEmail,
        resetPasswordOtp: { $exists: true, $ne: null }
      });

      if (lockedUser && (lockedUser.resetPasswordAttempts >= 5 || !lockedUser.resetPasswordExpire || Date.now() > new Date(lockedUser.resetPasswordExpire).getTime())) {
        // Invalidate OTP immediately to prevent any further attacks
        lockedUser.resetPasswordOtp = undefined;
        lockedUser.resetPasswordExpire = undefined;
        lockedUser.resetPasswordAttempts = 0;
        await lockedUser.save();

        return res.status(429).json({
          message: "Too many failed attempts. This OTP has been invalidated for security. Please request a new code."
        });
      }

      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // 2. Timing-safe verification against HMAC-SHA256
    const isMatch = verifyHashedOTP(user.resetPasswordOtp, otp);

    if (!isMatch) {
      const remaining = Math.max(0, 5 - user.resetPasswordAttempts);
      if (remaining <= 0) {
        // Invalidate OTP immediately on 5th failure
        user.resetPasswordOtp = undefined;
        user.resetPasswordExpire = undefined;
        user.resetPasswordAttempts = 0;
        await user.save();

        return res.status(429).json({
          message: "Too many failed attempts. This OTP has been invalidated for security. Please request a new code."
        });
      }

      return res.status(400).json({
        message: `Invalid OTP. ${remaining} attempt(s) remaining.`
      });
    }

    return res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * ============================================================
 * RESET PASSWORD (SEC-06 / Phase 9B.1)
 * ============================================================
 * - Re-verifies HMAC-SHA256 OTP
 * - Enforces minimum 6-character length
 * - Immediate atomic invalidation of OTP fields (prevents replay attacks)
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP and New Password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify user has active OTP within attempt limit
    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordOtp: { $exists: true, $ne: null },
      resetPasswordExpire: { $gt: Date.now() },
      resetPasswordAttempts: { $lt: 5 }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired session" });
    }

    // Verify HMAC-SHA256 OTP
    const isMatch = verifyHashedOTP(user.resetPasswordOtp, otp);

    if (!isMatch) {
      user.resetPasswordAttempts = (user.resetPasswordAttempts || 0) + 1;
      if (user.resetPasswordAttempts >= 5) {
        user.resetPasswordOtp = undefined;
        user.resetPasswordExpire = undefined;
        user.resetPasswordAttempts = 0;
        await user.save();
        return res.status(429).json({ message: "Too many failed attempts. Please request a new code." });
      }
      await user.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Invalidate OTP immediately to prevent replay
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpire = undefined;
    user.resetPasswordAttempts = 0;
    user.is_first_login = false;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now login."
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
