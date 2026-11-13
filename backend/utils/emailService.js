const nodemailer = require("nodemailer");
const { Resend } = require("resend");

// ============================================
// CENTRALIZED TRANSACTIONAL EMAIL CONFIGURATION
// MedsZop Official Sender: MedsZop <no-reply@medszop.com>
// ============================================

const DEFAULT_SENDER_EMAIL = "no-reply@medszop.com";
const DEFAULT_SENDER_NAME = "MedsZop";

// Import all templates from the unified design system
const emailTemplates = require("./emailTemplates");

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

/**
 * Generic Send Email function (Internal use across notifications)
 * Supports multipart/alternative (both html and plain-text)
 */
const sendEmail = async (to, subject, html, text = "") => {
  // UNCONDITIONAL MOCK IN TEST AND STAGING ENVIRONMENTS
  // Strictly blocks any outbound network dispatch to real inboxes
  if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "staging") {
    console.log(`[Email Mock (${process.env.NODE_ENV} mode)] Blocked live dispatch to: ${maskEmail(to)}, Subject: ${subject}`);
    return { id: `${process.env.NODE_ENV}-mock-email-` + Date.now(), messageId: `${process.env.NODE_ENV}-mock-msg-` + Date.now() };
  }

  // Priority 1: Resend HTTP API if configured
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const payload = {
      from: getResendFormattedSender(),
      to: [to],
      subject,
      html,
    };
    if (text) payload.text = text;

    const { data, error } = await resend.emails.send(payload);
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

    const mailOptions = {
      from: getFormattedSender(),
      to,
      subject,
      html,
    };
    if (text) mailOptions.text = text;

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Sent via SMTP to ${maskEmail(to)}`);
    return info;
  }

  // Fallback for development if no credentials configured
  console.log(`[Email Mock (Development Fallback)] To: ${maskEmail(to)}, Subject: ${subject}`);
  return { id: "mock-email-" + Date.now() };
};

/**
 * Send OTP Email (Registration & Sign-up)
 */
const sendOTPEmail = async (email, otp) => {
  return module.exports.sendEmail(
    email,
    "Your MedsZop Verification Code",
    emailTemplates.buildOTPEmailHTML(otp),
    emailTemplates.buildOTPEmailText(otp)
  );
};

/**
 * Send Password Reset OTP Email
 */
const sendPasswordResetEmail = async (email, otp) => {
  return module.exports.sendEmail(
    email,
    "Reset Your MedsZop Password",
    emailTemplates.buildPasswordResetEmailHTML(otp),
    emailTemplates.buildPasswordResetEmailText(otp)
  );
};

/**
 * Send Welcome Email
 */
const sendWelcomeEmail = async (email, name) => {
  return module.exports.sendEmail(
    email,
    "Welcome to MedsZop",
    emailTemplates.buildWelcomeEmailHTML(name),
    emailTemplates.buildWelcomeEmailText(name)
  );
};

/**
 * Order Lifecycle Notifications
 */
const sendOrderPlacedEmail = async (email, name, orderId) => {
  return module.exports.sendEmail(
    email,
    `Order Confirmation — #${orderId}`,
    emailTemplates.buildOrderPlacedEmail(name, orderId),
    emailTemplates.buildOrderPlacedEmailText(name, orderId)
  );
};

const sendOrderConfirmedEmail = async (email, name, orderId) => {
  return module.exports.sendEmail(
    email,
    `Order Confirmed — #${orderId}`,
    emailTemplates.buildOrderConfirmedEmail(name, orderId),
    emailTemplates.buildOrderConfirmedEmailText(name, orderId)
  );
};

const sendOrderCancelledEmail = async (email, name, orderId, reason) => {
  return module.exports.sendEmail(
    email,
    `Order Cancellation Notice — #${orderId}`,
    emailTemplates.buildOrderCancelledEmail(name, orderId, reason),
    emailTemplates.buildOrderCancelledEmailText(name, orderId, reason)
  );
};

const sendOrderDeliveredEmail = async (email, name, orderId) => {
  return module.exports.sendEmail(
    email,
    `Order Delivered — #${orderId}`,
    emailTemplates.buildOrderDeliveredEmail(name, orderId),
    emailTemplates.buildOrderDeliveredEmailText(name, orderId)
  );
};

/**
 * Partner & Operational Notifications
 */
const sendPharmacyOrderNotification = async (email, pharmacyName, orderId) => {
  return module.exports.sendEmail(
    email,
    `New Dispensing Order — #${orderId}`,
    emailTemplates.buildPharmacyOrderReceivedEmail(pharmacyName, orderId),
    emailTemplates.buildPharmacyOrderReceivedEmailText(pharmacyName, orderId)
  );
};

const sendDeliveryRequestNotification = async (email, partnerName, orderId, pickup, dropoff) => {
  return module.exports.sendEmail(
    email,
    `Delivery Assignment — Order #${orderId}`,
    emailTemplates.buildDeliveryRequestEmail(partnerName, orderId, pickup, dropoff),
    emailTemplates.buildDeliveryRequestEmailText(partnerName, orderId, pickup, dropoff)
  );
};

const sendApplicationSubmittedEmail = async (email, name, role, appId) => {
  return module.exports.sendEmail(
    email,
    "Application Received — MedsZop Partner Network",
    emailTemplates.buildApplicationSubmittedEmail(name, role, appId),
    emailTemplates.buildApplicationSubmittedEmailText(name, role, appId)
  );
};

const sendApplicationApprovedEmail = async (email, name, role, userEmail, tempPassword) => {
  return module.exports.sendEmail(
    email,
    "Application Approved — Welcome to MedsZop",
    emailTemplates.buildApplicationApprovedEmail(name, role, userEmail, tempPassword),
    emailTemplates.buildApplicationApprovedEmailText(name, role, userEmail, tempPassword)
  );
};

const sendApplicationRejectedEmail = async (email, name, role, reason) => {
  return module.exports.sendEmail(
    email,
    "Application Status Update — MedsZop",
    emailTemplates.buildApplicationRejectedEmail(name, role, reason),
    emailTemplates.buildApplicationRejectedEmailText(name, role, reason)
  );
};

module.exports = {
  // Core Dispatchers
  sendEmail,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendOrderPlacedEmail,
  sendOrderConfirmedEmail,
  sendOrderCancelledEmail,
  sendOrderDeliveredEmail,
  sendPharmacyOrderNotification,
  sendDeliveryRequestNotification,
  sendApplicationSubmittedEmail,
  sendApplicationApprovedEmail,
  sendApplicationRejectedEmail,

  // Re-exported Template Builders (HTML & Plain-Text)
  ...emailTemplates,

  // Configuration & Utilities
  validateEmailConfig,
  getSenderAddress,
  getSenderName,
  getFormattedSender,
  getResendFormattedSender,
  maskEmail
};
