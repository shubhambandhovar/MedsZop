const nodemailer = require("nodemailer");
const { Resend } = require("resend");

// ============================================
// CENTRALIZED TRANSACTIONAL EMAIL CONFIGURATION
// MedsZop Official Sender: MedsZop <no-reply@medszop.com>
// ============================================

const DEFAULT_SENDER_EMAIL = "no-reply@medszop.com";
const DEFAULT_SENDER_NAME = "MedsZop";

// Priority order for sender address:
// 1. EMAIL_FROM (explicit sender override)
// 2. SMTP_FROM (SMTP-specific sender override)
// 3. SMTP_USER (if it's a full email address)
// 4. Default: no-reply@medszop.com
function getSenderAddress() {
  const candidate =
    process.env.EMAIL_FROM ||
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    DEFAULT_SENDER_EMAIL;

  if (!candidate || !candidate.includes("@")) {
    return DEFAULT_SENDER_EMAIL;
  }
  return candidate.trim();
}

function getSenderName() {
  return process.env.EMAIL_FROM_NAME || DEFAULT_SENDER_NAME;
}

/**
 * Returns RFC 5322 formatted sender string for Nodemailer / SMTP
 * Example: '"MedsZop" <no-reply@medszop.com>'
 */
function getFormattedSender() {
  const email = getSenderAddress();
  const name = getSenderName();
  if (email.includes("<") && email.includes(">")) {
    return email;
  }
  return `"${name}" <${email}>`;
}

/**
 * Returns formatted sender string for Resend HTTP API
 * Example: 'MedsZop <no-reply@medszop.com>'
 */
function getResendFormattedSender() {
  const email = getSenderAddress();
  const name = getSenderName();
  if (email.includes("<") && email.includes(">")) {
    return email;
  }
  return `${name} <${email}>`;
}

/**
 * Masks an email for safe, PII-compliant logging
 * Example: 'john.doe@example.com' -> 'j***e@example.com'
 */
function maskEmail(email) {
  if (!email || typeof email !== "string" || !email.includes("@")) return "invalid-email";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `*@${domain}`;
  return `${local.charAt(0)}***${local.charAt(local.length - 1)}@${domain}`;
}

/**
 * Safe Configuration Validator & Diagnostic Reporter
 * Validates provider configuration without exposing any passwords, tokens, or secret keys.
 */
function validateEmailConfig() {
  const senderEmail = getSenderAddress();
  const senderName = getSenderName();
  const hasResend = Boolean(process.env.RESEND_API_KEY);
  const hasSMTP = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

  return {
    provider: hasResend ? "Resend HTTP API" : hasSMTP ? "SMTP (Nodemailer)" : "Mock / Local Development",
    sender: `${senderName} <${senderEmail}>`,
    senderEmail,
    senderDomain: senderEmail.split("@")[1] || "unknown",
    isComDomain: senderEmail.endsWith("@medszop.com"),
    configured: hasResend || hasSMTP,
    smtpHost: process.env.SMTP_HOST || (hasSMTP ? "mail.privateemail.com" : null),
    smtpPort: parseInt(process.env.SMTP_PORT) || 587,
    resendConfigured: hasResend
  };
}

// Canonical platform URLs for email templates
const getFrontendUrl = () => process.env.FRONTEND_URL || process.env.CLIENT_URL || "https://medszop.com";
const getPharmacyUrl = () => process.env.PHARMACY_URL || "https://pharmacy.medszop.com";
const getDeliveryUrl = () => process.env.DELIVERY_URL || "https://delivery.medszop.com";

/**
 * Build the OTP email HTML template
 */
const buildOTPEmailHTML = (otp) => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 0;">
    <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">MedsZop</h1>
      <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Smart Healthcare Platform</p>
    </div>
    <div style="background: #ffffff; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none;">
      <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 20px;">Verify Your Email</h2>
      <p style="color: #64748b; margin: 0 0 24px; font-size: 14px; line-height: 1.6;">
        Use the verification code below to complete your registration or password reset. This code is valid for <strong>5 minutes</strong>.
      </p>
      <div style="background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
        <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1e293b;">${otp}</span>
      </div>
      <p style="color: #94a3b8; margin: 0; font-size: 12px; line-height: 1.6;">
        If you didn't request this code, you can safely ignore this email. Do not share this code with anyone.
      </p>
    </div>
    <div style="background: #f8fafc; padding: 16px 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none; text-align: center;">
      <p style="color: #94a3b8; margin: 0; font-size: 12px;">&copy; ${new Date().getFullYear()} MedsZop. All rights reserved.</p>
    </div>
  </div>
`;

/**
 * Send OTP via Resend HTTP API (works on Render free/starter tiers)
 */
const sendViaResend = async (email, otp) => {
  if (process.env.NODE_ENV === "test") {
    console.log(`[Email Mock (test mode)] OTP via Resend to: ${maskEmail(email)}`);
    return { id: "test-resend-id-" + Date.now() };
  }

  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is not configured");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: getResendFormattedSender(),
    to: [email],
    subject: "Your MedsZop Verification Code",
    html: buildOTPEmailHTML(otp),
  });

  if (error) {
    console.error(`[Email Service Error] Resend OTP delivery failed to ${maskEmail(email)}:`, error.message);
    throw new Error(`Resend error: ${error.message}`);
  }

  console.log(`[Email] OTP sent via Resend to ${maskEmail(email)}, id: ${data.id}`);
  return data;
};

/**
 * Send OTP via SMTP (Nodemailer / Namecheap Private Email)
 */
const sendViaSMTP = async (email, otp) => {
  if (process.env.NODE_ENV === "test") {
    console.log(`[Email Mock (test mode)] OTP via SMTP to: ${maskEmail(email)}`);
    return { messageId: "test-smtp-msg-" + Date.now() };
  }

  const port = parseInt(process.env.SMTP_PORT) || 587;
  const host = process.env.SMTP_HOST || "mail.privateemail.com";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error("SMTP credentials (SMTP_USER / SMTP_PASS) are not configured");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });

  const info = await transporter.sendMail({
    from: getFormattedSender(),
    to: email,
    subject: "Your MedsZop Verification Code",
    html: buildOTPEmailHTML(otp),
  });

  console.log(`[Email] OTP sent via SMTP to ${maskEmail(email)}, messageId: ${info.messageId}`);
  return info;
};

/**
 * Generic Send Email function (Internal use across notifications)
 */
const sendEmail = async (to, subject, html) => {
  if (process.env.NODE_ENV === "test") {
    console.log(`[Email Mock (test mode)] To: ${maskEmail(to)}, Subject: ${subject}`);
    return { id: "test-mock-email-" + Date.now(), messageId: "test-mock-msg-" + Date.now() };
  }

  // Priority 1: Resend HTTP API if configured
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: getResendFormattedSender(),
      to: [to],
      subject,
      html,
    });
    if (error) {
      console.error(`[Email Service Error] Resend dispatch failed to ${maskEmail(to)}:`, error.message);
      throw new Error(`Resend error: ${error.message}`);
    }
    console.log(`[Email] Sent via Resend to ${maskEmail(to)}`);
    return data;
  }

  // Priority 2: SMTP if host is configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const port = parseInt(process.env.SMTP_PORT) || 587;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
    const info = await transporter.sendMail({
      from: getFormattedSender(),
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent via SMTP to ${maskEmail(to)}`);
    return info;
  }

  // Fallback for development if no credentials configured
  console.log(`[Email Mock (Development Fallback)] To: ${maskEmail(to)}, Subject: ${subject}`);
  return { id: "mock-email-" + Date.now() };
};

/**
 * Send OTP Email
 */
const sendOTPEmail = async (email, otp) => {
  return module.exports.sendEmail(email, "Your MedsZop Verification Code", buildOTPEmailHTML(otp));
};

/* =========================
 * WELCOME EMAIL
 * ========================= */
const buildWelcomeEmailHTML = (name) => {
  const appUrl = getFrontendUrl();
  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333333; line-height: 1.6;">
    <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800;">Welcome to MedsZop 🎉</h1>
      <p style="color: #d1fae5; margin: 8px 0 0; font-size: 16px;">We're thrilled to have you onboard, ${name}!</p>
    </div>
    
    <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none;">
      <p style="font-size: 16px; margin-bottom: 24px;">Hi ${name},</p>
      
      <p style="margin-bottom: 24px;">Thank you for joining MedsZop! You've just taken a big step towards smarter, faster healthcare.</p>
      
      <h3 style="color: #10b981; font-size: 18px; margin-bottom: 16px;">Here's what you can do now:</h3>
      
      <ul style="list-style: none; padding: 0; margin-bottom: 32px;">
        <li style="margin-bottom: 12px; padding-left: 24px; position: relative;">
          <span style="position: absolute; left: 0; color: #10b981;">✔</span>
          <strong>Same-Hour Delivery:</strong> Get medicines delivered to your doorstep in minutes.
        </li>
        <li style="margin-bottom: 12px; padding-left: 24px; position: relative;">
          <span style="position: absolute; left: 0; color: #10b981;">✔</span>
          <strong>AI Prescription Scanner:</strong> Instantly digitize and order from your prescription.
        </li>
        <li style="margin-bottom: 12px; padding-left: 24px; position: relative;">
          <span style="position: absolute; left: 0; color: #10b981;">✔</span>
          <strong>Doctor Consultations:</strong> Connect with top specialists instantly via chat or video.
        </li>
      </ul>
      
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${appUrl}" style="background-color: #10b981; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">Explore MedsZop Now</a>
      </div>
      
      <p style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">Need help? Our support team is here for you 24/7 at support@medszop.com.</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
      
      <p style="margin: 0; font-weight: 600;">Best regards,</p>
      <p style="margin: 0; color: #10b981;">Team MedsZop</p>
    </div>
    
    <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">&copy; ${new Date().getFullYear()} MedsZop. All rights reserved.</p>
    </div>
  </div>
`;
};

/**
 * Send Welcome Email
 */
const sendWelcomeEmail = async (email, name) => {
  return module.exports.sendEmail(email, "Welcome to MedsZop 🎉", buildWelcomeEmailHTML(name));
};

/* =========================
 * ORDER PLACED EMAIL
 * ========================= */
const buildOrderPlacedEmail = (name, orderIdNumber) => {
  const appUrl = getFrontendUrl();
  return `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333333;">
  <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Order Received! 📦</h1>
    <p style="color: #bfdbfe; margin: 5px 0 0;">Thank you for shopping with MedsZop</p>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px;">Hi ${name},</p>
    <p>We've received your order <strong>#${orderIdNumber}</strong> and sent it to the pharmacy for confirmation.</p>
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <a href="${appUrl}/orders/${orderIdNumber}" style="color: #2563eb; text-decoration: none; font-weight: 600;">Track Your Order</a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">We'll notify you once the pharmacy confirms your order.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
    <p style="margin: 0;">Team MedsZop</p>
  </div>
</div>
`;
};

/* =========================
 * ORDER CONFIRMED EMAIL
 * ========================= */
const buildOrderConfirmedEmail = (name, orderIdNumber) => {
  const appUrl = getFrontendUrl();
  return `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333333;">
  <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Order Confirmed! ✅</h1>
    <p style="color: #d1fae5; margin: 5px 0 0;">Your medicines are being packed.</p>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px;">Hi ${name},</p>
    <p>Great news! The pharmacy has accepted your order <strong>#${orderIdNumber}</strong>.</p>
    <p>A delivery partner will be assigned shortly.</p>
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <a href="${appUrl}/orders/${orderIdNumber}" style="color: #059669; text-decoration: none; font-weight: 600;">Track Status</a>
    </div>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
    <p style="margin: 0;">Team MedsZop</p>
  </div>
</div>
`;
};

/* =========================
 * ORDER CANCELLED EMAIL
 * ========================= */
const buildOrderCancelledEmail = (name, orderIdNumber) => `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333333;">
  <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Order Cancelled ❌</h1>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px;">Hi ${name},</p>
    <p>We're sorry, but your order <strong>#${orderIdNumber}</strong> was cancelled by the pharmacy (likely due to stock unavailability).</p>
    <p>Any amount paid will be refunded within 3-5 business days.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
    <p style="margin: 0;">Team MedsZop</p>
  </div>
</div>
`;

/* =========================
 * ORDER DELIVERED EMAIL
 * ========================= */
const buildOrderDeliveredEmail = (name, orderIdNumber) => {
  const appUrl = getFrontendUrl();
  return `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333333;">
  <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Order Delivered! 🎉</h1>
    <p style="color: #e9d5ff; margin: 5px 0 0;">Enjoy your health & wellness.</p>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px;">Hi ${name},</p>
    <p>Your order <strong>#${orderIdNumber}</strong> has been successfully delivered.</p>
    <p>Thank you for choosing MedsZop for your healthcare needs.</p>
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <a href="${appUrl}/orders/${orderIdNumber}" style="color: #7c3aed; text-decoration: none; font-weight: 600;">View Order Details</a>
    </div>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
    <p style="margin: 0;">Team MedsZop</p>
  </div>
</div>
`;
};

/* =========================
 * PHARMACY - NEW ORDER EMAIL
 * ========================= */
const buildPharmacyOrderReceivedEmail = (pharmacyName, orderId) => {
  const pharmacyUrl = getPharmacyUrl();
  return `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333333;">
  <div style="background: linear-gradient(135deg, #0ea5e9, #0284c7); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Order Received! 💊</h1>
    <p style="color: #e0f2fe; margin: 5px 0 0;">Action Required</p>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px;">Hello ${pharmacyName},</p>
    <p>You have received a new order with ID <strong>#${orderId}</strong>.</p>
    <p>Please review the order details and approve or cancel it as soon as possible.</p>
    
    <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <a href="${pharmacyUrl}/orders/${orderId}" style="color: #0284c7; text-decoration: none; font-weight: 600; font-size: 16px;">
        Review Order in Dashboard
      </a>
    </div>

    <p style="color: #64748b; font-size: 14px;">Timely confirmation helps ensure faster delivery for customers.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
    <p style="margin: 0;">MedsZop Admin Team</p>
  </div>
</div>
`;
};

/* =========================
 * DELIVERY - NEW REQUEST EMAIL
 * ========================= */
const buildDeliveryRequestEmail = (partnerName, orderId, pickupLoc, dropoffLoc) => {
  const deliveryUrl = getDeliveryUrl();
  return `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333333;">
  <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Delivery Request 🚴</h1>
    <p style="color: #fef3c7; margin: 5px 0 0;">Ready for pickup</p>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px;">Hello ${partnerName},</p>
    <p>You have a new delivery request for Order <strong>#${orderId}</strong>.</p>
    
    <div style="margin: 20px 0; padding: 15px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px;">
      <p style="margin: 5px 0;"><strong>📍 Pickup:</strong> ${pickupLoc}</p>
      <p style="margin: 5px 0;"><strong>🏠 Delivery:</strong> ${dropoffLoc}</p>
    </div>

    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <a href="${deliveryUrl}/orders/${orderId}" style="color: #d97706; text-decoration: none; font-weight: 600; font-size: 16px;">
        View Request in Dashboard
      </a>
    </div>

    <p style="color: #64748b; font-size: 14px;">Please update your status if you accept this delivery.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
    <p style="margin: 0;">MedsZop Logistics</p>
  </div>
</div>
`;
};

const sendOrderPlacedEmail = async (email, name, orderId) => {
  return module.exports.sendEmail(email, "Thank you for your order with MedsZop 💊", buildOrderPlacedEmail(name, orderId));
};

const sendOrderConfirmedEmail = async (email, name, orderId) => {
  return module.exports.sendEmail(email, "Your MedsZop order is confirmed ✅", buildOrderConfirmedEmail(name, orderId));
};

const sendOrderCancelledEmail = async (email, name, orderId) => {
  return module.exports.sendEmail(email, "Your MedsZop order was cancelled ❌", buildOrderCancelledEmail(name, orderId));
};

const sendOrderDeliveredEmail = async (email, name, orderId) => {
  return module.exports.sendEmail(email, "Your MedsZop order has been delivered 🎉", buildOrderDeliveredEmail(name, orderId));
};

const sendPharmacyOrderNotification = async (email, pharmacyName, orderId) => {
  return module.exports.sendEmail(email, "New order received on MedsZop 💊", buildPharmacyOrderReceivedEmail(pharmacyName, orderId));
};

const sendDeliveryRequestNotification = async (email, partnerName, orderId, pickup, dropoff) => {
  return module.exports.sendEmail(email, "New delivery request from MedsZop 🚴", buildDeliveryRequestEmail(partnerName, orderId, pickup, dropoff));
};

module.exports = {
  // Core Dispatchers
  sendOTPEmail,
  sendEmail,
  sendWelcomeEmail,
  sendOrderPlacedEmail,
  sendOrderConfirmedEmail,
  sendOrderCancelledEmail,
  sendOrderDeliveredEmail,
  sendPharmacyOrderNotification,
  sendDeliveryRequestNotification,

  // Template HTML Builders
  buildOTPEmailHTML,
  buildWelcomeEmailHTML,
  buildOrderPlacedEmail,
  buildOrderConfirmedEmail,
  buildOrderCancelledEmail,
  buildOrderDeliveredEmail,
  buildPharmacyOrderReceivedEmail,
  buildDeliveryRequestEmail,

  // Configuration & Utilities
  validateEmailConfig,
  getSenderAddress,
  getSenderName,
  getFormattedSender,
  getResendFormattedSender,
  maskEmail
};
