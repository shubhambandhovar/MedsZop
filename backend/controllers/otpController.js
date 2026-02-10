const { sendOTPEmail } = require("../utils/emailService");

// In-memory OTP store (use Redis in production for better scalability)
const otpStore = new Map();

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Clean up expired OTPs periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(email);
    }
  }
}, 60000); // Clean every 60 seconds

/**
 * =========================
 * SEND OTP
 * =========================
 */
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Rate limiting: max 1 OTP per 60 seconds per email
    const existing = otpStore.get(email.toLowerCase());
    if (existing && Date.now() - existing.createdAt < 60000) {
      const waitSeconds = Math.ceil((60000 - (Date.now() - existing.createdAt)) / 1000);
      return res.status(429).json({
        message: `Please wait ${waitSeconds} seconds before requesting a new OTP`,
      });
    }

    const otp = generateOTP();
    const now = Date.now();

    // Store OTP with 5-minute expiry
    otpStore.set(email.toLowerCase(), {
      otp,
      createdAt: now,
      expiresAt: now + 5 * 60 * 1000, // 5 minutes
      attempts: 0,
    });

    // Send OTP email
    await sendOTPEmail(email, otp);

    return res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Send OTP error:", err.message, err.code);
    return res.status(500).json({ 
      message: "Failed to send OTP. Please try again.",
      error: process.env.NODE_ENV !== "production" ? err.message : undefined
    });
  }
};

/**
 * =========================
 * VERIFY OTP
 * =========================
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const stored = otpStore.get(email.toLowerCase());

    if (!stored) {
      return res.status(400).json({ message: "OTP expired or not found. Please request a new one." });
    }

    // Check expiry
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Check max attempts (5 attempts max)
    if (stored.attempts >= 5) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ message: "Too many failed attempts. Please request a new OTP." });
    }

    // Verify OTP
    if (stored.otp !== otp) {
      stored.attempts += 1;
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    // OTP is valid - remove it
    otpStore.delete(email.toLowerCase());

    return res.json({ message: "OTP verified successfully", verified: true });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ message: "OTP verification failed" });
  }
};
