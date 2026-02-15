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
 * Generic Send Email function (Internal use)
 */
const sendEmail = async (to, subject, html) => {
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html,
    });
    if (error) throw new Error(`Resend error: ${error.message}`);
    console.log(`[Email] Sent via Resend to ${to}`);
    return data;
  }

  if (process.env.SMTP_HOST) {
    // Reuse SMTP transporter logic
    const port = parseInt(process.env.SMTP_PORT) || 465;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      tls: { rejectUnauthorized: false }
    });
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent via SMTP to ${to}`);
    return info;
  }

  // Fallback for development if no creds
  console.log(`[Email Mock] To: ${to}, Subject: ${subject}`);
  return { id: "mock-email" };
};

/**
 * Send OTP Email
 */
const sendOTPEmail = async (email, otp) => {
  return sendEmail(email, "Your MedsZop Verification Code", buildOTPEmailHTML(otp));
};

/* =========================
 * WELCOME EMAIL
 * ========================= */
const buildWelcomeEmailHTML = (name) => `
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
        <a href="https://medszop.site" style="background-color: #10b981; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">Explore MedsZop Now</a>
      </div>
      
      <p style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">Need help? Our support team is here for you 24/7.</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
      
      <p style="margin: 0; font-weight: 600;">Best regards,</p>
      <p style="margin: 0; color: #10b981;">Team MedsZop</p>
    </div>
    
    <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">&copy; ${new Date().getFullYear()} MedsZop. All rights reserved.</p>
    </div>
  </div>
`;

/**
 * Send Welcome Email
 */
const sendWelcomeEmail = async (email, name) => {
  return sendEmail(email, "Welcome to MedsZop 🎉", buildWelcomeEmailHTML(name));
};

module.exports = { sendOTPEmail, sendEmail, sendWelcomeEmail };
