const nodemailer = require("nodemailer");

const createTransporter = () => {
  const port = parseInt(process.env.SMTP_PORT) || 587;
  console.log(`[Email] Creating SMTP transporter: ${process.env.SMTP_HOST}:${port}, user: ${process.env.SMTP_USER}`);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000, // 10s
    greetingTimeout: 10000, // 10s
    socketTimeout: 15000, // 15s
  });
};

/**
 * Send OTP email
 */
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"MedsZop" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Your MedsZop Verification Code",
    html: `
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
    `,
  };

  const transporter = createTransporter();
  const info = await transporter.sendMail(mailOptions);
  console.log(`[Email] OTP sent to ${email}, messageId: ${info.messageId}`);
  return info;
};

module.exports = { sendOTPEmail };
