const nodemailer = require("nodemailer");
const { Resend } = require("resend");

// ============================================
// EMAIL SERVICE
// Resend HTTP API (production/Render) + SMTP (local fallback)
// Render free tier blocks SMTP ports (465/587),
// so we use Resend HTTP API for production.
// ============================================

const FROM_EMAIL = process.env.SMTP_USER || "no-reply@medszop.site";
const FROM_NAME = "MedsZop";

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
        Use the verification code below to complete your registration. This code is valid for <strong>5 minutes</strong>.
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
 * Send OTP via Resend HTTP API (works on Render free tier)
 */
const sendViaResend = async (email, otp) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: [email],
    subject: "Your MedsZop Verification Code",
    html: buildOTPEmailHTML(otp),
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  console.log(`[Email] OTP sent via Resend to ${email}, id: ${data.id}`);
  return data;
};

/**
 * Send OTP via SMTP (local development fallback)
 */
const sendViaSMTP = async (email, otp) => {
  const port = parseInt(process.env.SMTP_PORT) || 465;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "mail.privateemail.com",
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });

  const info = await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: email,
    subject: "Your MedsZop Verification Code",
    html: buildOTPEmailHTML(otp),
  });

  console.log(`[Email] OTP sent via SMTP to ${email}, messageId: ${info.messageId}`);
  return info;
};

/**
 * Send OTP Email - auto-selects Resend (production) or SMTP (local)
 */
const sendOTPEmail = async (email, otp) => {
  if (process.env.RESEND_API_KEY) {
    console.log("[Email] Using Resend API");
    return sendViaResend(email, otp);
  }

  if (process.env.SMTP_HOST) {
    console.log("[Email] Using SMTP (local)");
    return sendViaSMTP(email, otp);
  }

  throw new Error("No email provider configured. Set RESEND_API_KEY or SMTP_HOST.");
};

module.exports = { sendOTPEmail };
