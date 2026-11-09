/**
 * MedsZop Safe Logger Utility
 * Sanitizes sensitive fields (passwords, tokens, OTPs, medical conversations)
 * before logging to standard output.
 */

const SENSITIVE_KEYS = new Set([
  "password",
  "newPassword",
  "confirmPassword",
  "token",
  "jwt",
  "authorization",
  "otp",
  "resetPasswordOtp",
  "delivery_otp",
  "symptoms",
  "messages",
  "raw_text",
  "cvv",
  "cardNumber"
]);

function maskValue(val) {
  return "****";
}

function sanitizeObject(obj, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 5) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    let isSensitive = false;
    for (const sKey of SENSITIVE_KEYS) {
      if (lowerKey.includes(sKey.toLowerCase())) {
        isSensitive = true;
        break;
      }
    }

    if (isSensitive) {
      sanitized[key] = maskValue(value);
    } else if (value && typeof value === "object") {
      sanitized[key] = sanitizeObject(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

const safeLogger = {
  info: (message, ...args) => {
    const sanitizedArgs = args.map((arg) => (typeof arg === "object" ? sanitizeObject(arg) : arg));
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...sanitizedArgs);
  },
  warn: (message, ...args) => {
    const sanitizedArgs = args.map((arg) => (typeof arg === "object" ? sanitizeObject(arg) : arg));
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...sanitizedArgs);
  },
  error: (message, ...args) => {
    const sanitizedArgs = args.map((arg) => {
      if (arg instanceof Error) {
        return { message: arg.message, stack: process.env.NODE_ENV === "development" ? arg.stack : undefined };
      }
      return typeof arg === "object" ? sanitizeObject(arg) : arg;
    });
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...sanitizedArgs);
  },
  sanitize: sanitizeObject
};

module.exports = safeLogger;
