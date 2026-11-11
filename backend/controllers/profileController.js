const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/User");
const Pharmacy = require("../models/Pharmacy");
const AuditLog = require("../models/AuditLog");
const sessionManager = require("../utils/sessionManager");
const { isProtectedAdminUser } = require("../utils/protectedAdmin");
const { sendOTPEmail } = require("../utils/emailService");

/**
 * Server-secret key for HMAC OTP hashing
 */
const getOTPSecret = () => {
  return process.env.OTP_SECRET || process.env.JWT_SECRET || "medszop_secure_otp_server_secret_key_2026";
};

const hashOTP = (otp) => {
  return crypto.createHmac("sha256", getOTPSecret()).update(otp.toString().trim()).digest("hex");
};

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

/**
 * Audit log helper
 */
async function logProfileAudit(req, action, targetId, details) {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return; // Skip DB write when not connected in isolated test environments
    }
    await AuditLog.create({
      admin_id: req.user ? req.user.id : null,
      admin_email: req.user ? req.user.email : "user@medszop.com",
      action,
      target_type: "User",
      target_id: String(targetId || ""),
      details: details || {},
      ip_address: req.ip || (req.headers && req.headers["x-forwarded-for"]) || "127.0.0.1",
    });
  } catch (err) {
    console.warn("Profile audit log write failed:", err.message);
  }
}

/**
 * GET UNIVERSAL PROFILE (/api/profile)
 * Returns comprehensive profile with role-specific details and protection status
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User account not found" });
    }

    const profileData = user.toObject();
    const isProtected = isProtectedAdminUser(user);
    profileData.isProtectedAdmin = isProtected;
    profileData.protectedAdminType = user.protectedAdminType || (isProtected ? "founder" : null);

    // Attach Role-Specific details
    if (user.role === "pharmacy") {
      const pharmacy = await Pharmacy.findOne({ email: user.email.toLowerCase().trim() });
      if (pharmacy) {
        profileData.pharmacyProfile = {
          name: pharmacy.name,
          address: pharmacy.address,
          license_number: pharmacy.license_number,
          verified: pharmacy.verified,
          pharmacist_name: pharmacy.pharmacist_name,
          pincode: pharmacy.pincode,
          city: pharmacy.city,
        };
      }
    }

    return res.json({
      success: true,
      profile: profileData,
    });
  } catch (err) {
    console.error("Get profile error:", err);
    return res.status(500).json({ message: "Failed to retrieve profile", error: err.message });
  }
};

/**
 * UPDATE UNIVERSAL PROFILE (/api/profile)
 * Safely updates personal details, preferences, and role-specific data.
 * Strictly ignores role, protection flags, email, and password.
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User account not found" });
    }

    const {
      name,
      avatarUrl,
      languagePreference,
      notificationPreferences,
      doctorProfile,
      deliveryProfile,
      pharmacyDetails,
      address,
    } = req.body;

    // 1. General Profile
    if (name && typeof name === "string") {
      user.name = name.trim();
    }
    if (avatarUrl !== undefined && typeof avatarUrl === "string") {
      user.avatarUrl = avatarUrl.trim();
    }
    if (languagePreference && typeof languagePreference === "string") {
      user.languagePreference = languagePreference.trim();
    }
    if (notificationPreferences && typeof notificationPreferences === "object") {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...notificationPreferences,
      };
    }

    // 2. Role-Specific Profile Details
    if (user.role === "doctor" && doctorProfile && typeof doctorProfile === "object") {
      user.doctorProfile = {
        ...user.doctorProfile,
        specialization: doctorProfile.specialization || user.doctorProfile?.specialization,
        qualifications: doctorProfile.qualifications || user.doctorProfile?.qualifications,
        clinicAddress: doctorProfile.clinicAddress || user.doctorProfile?.clinicAddress,
      };
    }

    if (user.role === "delivery" && deliveryProfile && typeof deliveryProfile === "object") {
      user.deliveryProfile = {
        ...user.deliveryProfile,
        vehicleType: deliveryProfile.vehicleType || user.deliveryProfile?.vehicleType,
        vehicleNumber: deliveryProfile.vehicleNumber || user.deliveryProfile?.vehicleNumber,
        licenseNumber: deliveryProfile.licenseNumber || user.deliveryProfile?.licenseNumber,
        emergencyContact: deliveryProfile.emergencyContact || user.deliveryProfile?.emergencyContact,
      };
    }

    if (user.role === "pharmacy" && pharmacyDetails && typeof pharmacyDetails === "object") {
      const pharmacy = await Pharmacy.findOne({ email: user.email.toLowerCase().trim() });
      if (pharmacy) {
        if (pharmacyDetails.store_name) pharmacy.name = pharmacyDetails.store_name;
        if (pharmacyDetails.address) pharmacy.address = pharmacyDetails.address;
        if (pharmacyDetails.pharmacist_name) pharmacy.pharmacist_name = pharmacyDetails.pharmacist_name;
        await pharmacy.save();
      }
    }

    // Handle generic address update if provided
    if (address && typeof address === "string") {
      if (user.addresses && user.addresses.length > 0) {
        user.addresses[0].addressLine1 = address;
      } else {
        user.addresses.push({
          addressLine1: address,
          addressType: "Home",
          name: user.name,
          mobile: user.phone || "",
        });
      }
    }

    await user.save();

    await logProfileAudit(req, "UPDATE_PROFILE", user._id, {
      updatedFields: Object.keys(req.body).filter(
        (k) => !["role", "isProtectedAdmin", "email", "password"].includes(k)
      ),
    });

    const updatedObj = user.toObject();
    delete updatedObj.password;
    const isProtected = isProtectedAdminUser(user);
    updatedObj.isProtectedAdmin = isProtected;
    updatedObj.protectedAdminType = user.protectedAdminType || (isProtected ? "founder" : null);

    return res.json({
      success: true,
      message: "Profile updated successfully",
      profile: updatedObj,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
};

/**
 * REQUEST EMAIL CHANGE (/api/profile/request-email-change)
 * Dispatches a 6-digit OTP to the new email address before committing change
 */
exports.requestEmailChange = async (req, res) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail || typeof newEmail !== "string") {
      return res.status(400).json({ message: "Valid new email address is required" });
    }

    const normalizedNewEmail = newEmail.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedNewEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check if new email is already taken
    const existing = await User.findOne({ email: normalizedNewEmail });
    if (existing) {
      return res.status(400).json({ message: "This email address is already registered by another account" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User account not found" });
    }

    // Generate 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const otpHash = hashOTP(rawOtp);
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailChangePending = {
      newEmail: normalizedNewEmail,
      otpHash,
      otpExpire,
      attempts: 0,
    };
    await user.save();

    // Send verification code to the NEW email address
    try {
      await sendOTPEmail(normalizedNewEmail, rawOtp, user.name);
    } catch (emailErr) {
      console.error("Email change OTP delivery failed:", emailErr.message);
      return res.status(500).json({ message: "Failed to dispatch verification code to new email address" });
    }

    return res.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${normalizedNewEmail}. Please verify to complete email change.`,
    });
  } catch (err) {
    console.error("Request email change error:", err);
    return res.status(500).json({ message: "Failed to initiate email change", error: err.message });
  }
};

/**
 * VERIFY EMAIL CHANGE (/api/profile/verify-email-change)
 * Validates OTP and updates email address
 */
exports.verifyEmailChange = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: "Verification code is required" });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.emailChangePending || !user.emailChangePending.newEmail) {
      return res.status(400).json({ message: "No pending email change request found" });
    }

    const pending = user.emailChangePending;

    // Check expiry
    if (new Date() > new Date(pending.otpExpire)) {
      user.emailChangePending = undefined;
      await user.save();
      return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
    }

    // Check attempts limit
    if ((pending.attempts || 0) >= 5) {
      user.emailChangePending = undefined;
      await user.save();
      return res.status(429).json({ message: "Too many failed attempts. Email change request cancelled." });
    }

    // Verify OTP
    const isMatch = verifyHashedOTP(pending.otpHash, otp);
    if (!isMatch) {
      pending.attempts = (pending.attempts || 0) + 1;
      await user.save();
      return res.status(400).json({ message: "Invalid verification code" });
    }

    const oldEmail = user.email;
    const newEmail = pending.newEmail;

    user.email = newEmail;
    user.emailChangePending = undefined;
    await user.save();

    // Revoke other active sessions for security
    await sessionManager.revokeUserSessions(user._id, "EMAIL_CHANGED", req.session?.sessionId);

    await logProfileAudit(req, "EMAIL_CHANGED", user._id, {
      from: oldEmail,
      to: newEmail,
    });

    return res.json({
      success: true,
      message: "Email address successfully updated",
      email: user.email,
    });
  } catch (err) {
    console.error("Verify email change error:", err);
    return res.status(500).json({ message: "Failed to verify email change", error: err.message });
  }
};

/**
 * LIST ACTIVE SESSIONS (/api/profile/sessions)
 */
exports.listSessions = async (req, res) => {
  try {
    const currentSessionId = req.session?.sessionId || null;
    const sessions = await sessionManager.getUserSessions(req.user.id, currentSessionId);
    return res.json({ success: true, sessions });
  } catch (err) {
    return res.status(500).json({ message: "Failed to list sessions", error: err.message });
  }
};

/**
 * REVOKE SINGLE SESSION (/api/profile/sessions/:sessionId/revoke)
 */
exports.revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    await sessionManager.revokeSession(sessionId, "USER_MANUAL_REVOKE");
    return res.json({ success: true, message: "Session revoked successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to revoke session", error: err.message });
  }
};

/**
 * REVOKE OTHER SESSIONS (/api/profile/sessions/revoke-others)
 */
exports.revokeOtherSessions = async (req, res) => {
  try {
    const currentSessionId = req.session?.sessionId || null;
    await sessionManager.revokeUserSessions(req.user.id, "USER_REVOKED_OTHERS", currentSessionId);
    return res.json({ success: true, message: "Signed out from all other active sessions" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to revoke other sessions", error: err.message });
  }
};
