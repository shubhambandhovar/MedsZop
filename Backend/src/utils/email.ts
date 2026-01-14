import nodemailer from 'nodemailer';

interface SendAdminInvitePayload {
  to: string;
  name: string;
  inviteLink: string;
  expires: Date;
}

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const emailFrom = process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@medszop.com';
const emailFromName = process.env.EMAIL_FROM_NAME || 'MedsZop Admin';

const emailConfigured = Boolean(smtpHost && smtpPort && smtpUser && smtpPass);

const transporter = emailConfigured
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })
  : null;

export const sendAdminInviteEmail = async (payload: SendAdminInvitePayload) => {
  if (!emailConfigured || !transporter) {
    console.warn('[mailer] SMTP not configured. Invite link:', payload.inviteLink);
    return { sent: false, reason: 'SMTP not configured' } as const;
  }

  const { to, name, inviteLink, expires } = payload;
  const formattedFrom = `${emailFromName} <${emailFrom}>`;
  const expiresAt = expires instanceof Date ? expires.toLocaleString() : String(expires);

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111">
      <h2>You're invited to MedsZop Admin</h2>
      <p>Hi ${name || 'there'},</p>
      <p>You have been granted admin access. Click the button below to set your password and activate your account.</p>
      <p style="margin: 16px 0;">
        <a href="${inviteLink}" style="background:#2563eb;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:600;">Set your password</a>
      </p>
      <p>Or copy this link: <br /><a href="${inviteLink}">${inviteLink}</a></p>
      <p><strong>Expires:</strong> ${expiresAt}</p>
      <p>If you didn't expect this email, you can ignore it.</p>
      <p>— MedsZop Team</p>
    </div>
  `;

  const text = `You're invited to MedsZop Admin\n\n` +
    `Set your password: ${inviteLink}\n` +
    `Expires: ${expiresAt}\n\n` +
    `If you didn't expect this email, you can ignore it.`;

  await transporter.sendMail({
    from: formattedFrom,
    to,
    subject: 'You are invited to MedsZop Admin',
    text,
    html,
  });

  return { sent: true } as const;
};
