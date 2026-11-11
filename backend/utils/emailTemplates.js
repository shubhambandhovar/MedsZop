/**
 * backend/utils/emailTemplates.js
 *
 * MedsZop Premium Transactional Email Design System
 * Inspired by the clarity, restraint, and precision of premium healthcare & fintech platforms.
 *
 * Architecture:
 * - 100% email-client compatible table layout (Outlook, Gmail, Apple Mail, Yahoo)
 * - Clean white background (#ffffff) on soft neutral canvas (#f8fafc)
 * - Refined system typography with precise hierarchy and 1.6 line-height
 * - Restrained emerald/teal accents (#0f766e, #0d9488)
 * - High-DPI PNG brand logo with bulletproof alt text
 * - Zero emojis in headings, subjects, or buttons
 * - High-contrast accessible colors (>= 4.5:1 ratio)
 * - Companion plain-text generator for every template (multipart/alternative)
 */

const getFrontendUrl = () => process.env.FRONTEND_URL || process.env.CLIENT_URL || "https://medszop.com";
const getPharmacyUrl = () => process.env.PHARMACY_URL || "https://pharmacy.medszop.com";
const getDeliveryUrl = () => process.env.DELIVERY_URL || "https://delivery.medszop.com";

const LOGO_URL = "https://res.cloudinary.com/dih1im0zi/image/upload/h_56,f_png/v1771198740/medszoplogo_hjhsxv.png";

/**
 * Base Master HTML Layout for all transactional emails
 */
function renderBaseEmailLayout({
  previewText = "",
  title = "MedsZop Notification",
  heading = "",
  introText = "",
  childrenHtml = "",
  ctaText = "",
  ctaUrl = "",
  metadataRows = [],
  secondaryNote = ""
}) {
  const currentYear = new Date().getFullYear();
  const frontendUrl = getFrontendUrl();

  // Render metadata key-value table if present
  let metadataHtml = "";
  if (metadataRows && metadataRows.length > 0) {
    const rowsHtml = metadataRows
      .map(
        (row) => `
        <tr>
          <td style="padding: 10px 16px; font-size: 13px; color: #64748b; font-weight: 500; border-bottom: 1px solid #f1f5f9; width: 40%; vertical-align: top;">
            ${row.label}
          </td>
          <td style="padding: 10px 16px; font-size: 13px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #f1f5f9; font-family: ${
            row.mono ? "ui-monospace, Menlo, Monaco, 'Courier New', monospace" : "inherit"
          };">
            ${row.value}
          </td>
        </tr>`
      )
      .join("");

    metadataHtml = `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0 24px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; border-collapse: separate;">
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>`;
  }

  // Render primary CTA button if present
  let ctaHtml = "";
  if (ctaText && ctaUrl) {
    ctaHtml = `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px 0 24px 0;">
        <tr>
          <td align="left" style="border-radius: 6px; background-color: #0f766e;">
            <a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px; letter-spacing: 0.01em;">
              ${ctaText}
            </a>
          </td>
        </tr>
      </table>`;
  }

  // Secondary note if present
  let noteHtml = "";
  if (secondaryNote) {
    noteHtml = `
      <div style="margin: 24px 0 0 0; padding: 14px 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; line-height: 1.5; color: #475569;">
        ${secondaryNote}
      </div>`;
  }

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; min-width: 100%; background-color: #f8fafc; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: 0 auto !important; border-radius: 0 !important; }
      .content-cell { padding: 24px 20px !important; }
      .header-cell { padding: 24px 20px 20px !important; }
      .footer-cell { padding: 24px 20px 32px !important; }
      .code-display { font-size: 26px !important; letter-spacing: 4px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #334155;">
  <!-- Preheader text for email client inbox snippet -->
  ${
    previewText
      ? `<div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
          ${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
        </div>`
      : ""
  }

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-collapse: collapse; min-width: 100%;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <!-- Email Container Card -->
        <!--[if (gte mso 9)|(IE)]>
        <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" width="580">
        <tr>
        <td align="center" valign="top" width="580">
        <![endif]-->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 580px; width: 100%; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; border-collapse: separate; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.03);">
          
          <!-- Header Bar -->
          <tr>
            <td class="header-cell" style="padding: 32px 36px 20px; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <a href="${frontendUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
                      <img src="${LOGO_URL}" alt="MedsZop" height="26" style="display: block; height: 26px; width: auto; border: 0;" />
                    </a>
                  </td>
                  <td align="right" style="vertical-align: middle; font-size: 12px; font-weight: 500; color: #64748b; letter-spacing: 0.02em;">
                    Healthcare Platform
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td class="content-cell" style="padding: 32px 36px;">
              ${
                heading
                  ? `<h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; line-height: 1.35; color: #0f172a; letter-spacing: -0.01em;">
                      ${heading}
                    </h1>`
                  : ""
              }
              ${
                introText
                  ? `<p style="margin: 0 0 18px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                      ${introText}
                    </p>`
                  : ""
              }
              ${metadataHtml}
              ${childrenHtml}
              ${ctaHtml}
              ${noteHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer-cell" style="padding: 24px 36px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; border-radius: 0 0 8px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-size: 12px; line-height: 1.5; color: #64748b;">
                    <p style="margin: 0 0 6px 0; font-weight: 500; color: #475569;">
                      MedsZop Healthcare Technologies Private Limited
                    </p>
                    <p style="margin: 0 0 10px 0;">
                      <a href="mailto:support@medszop.com" style="color: #0f766e; text-decoration: none; font-weight: 500;">support@medszop.com</a>
                      &nbsp;&bull;&nbsp;
                      <a href="${frontendUrl}" style="color: #64748b; text-decoration: none;">medszop.com</a>
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.4;">
                      &copy; ${currentYear} MedsZop. All rights reserved.<br>
                      This is an official transactional notification regarding your MedsZop account.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Reusable Code Display Block for OTPs
 */
function renderCodeBlock(code, label = "Verification Code", expiry = "Valid for 5 minutes") {
  return `
    <div style="margin: 24px 0; padding: 24px 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; text-align: center;">
      <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 8px;">
        ${label}
      </div>
      <div class="code-display" style="font-family: ui-monospace, Menlo, Monaco, 'Courier New', monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0f766e; line-height: 1.1; margin: 4px 0 8px 0;">
        ${code}
      </div>
      <div style="font-size: 12px; color: #64748b;">
        ${expiry}
      </div>
    </div>`;
}

/* =============================================================================
 * 1. CUSTOMER WELCOME EMAIL
 * ============================================================================= */
function buildWelcomeEmailHTML(name = "Customer") {
  const appUrl = getFrontendUrl();
  return renderBaseEmailLayout({
    previewText: "Your MedsZop account is active. Manage prescriptions, orders, and consultations.",
    title: "Welcome to MedsZop",
    heading: `Welcome to MedsZop, ${name}`,
    introText: "Your account is now active. MedsZop connects you with licensed local pharmacies, verified diagnostic services, and board-certified healthcare professionals through a single, secure platform.",
    childrenHtml: `
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">
        You can now upload prescriptions, order medications directly from verified dispensaries, and access digital consultations whenever you need care.
      </p>
      <div style="margin: 20px 0; padding: 18px 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
        <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 10px;">Available Account Capabilities:</div>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding: 4px 0; font-size: 13px; color: #475569; line-height: 1.5;">
              <strong style="color: #0f172a;">Prescription Review:</strong> Upload prescriptions for direct pharmacist verification.
            </td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-size: 13px; color: #475569; line-height: 1.5;">
              <strong style="color: #0f172a;">Licensed Dispensaries:</strong> Orders are fulfilled only by state-licensed partner pharmacies.
            </td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-size: 13px; color: #475569; line-height: 1.5;">
              <strong style="color: #0f172a;">Order Tracking:</strong> Live status updates from fulfillment to doorstep handover.
            </td>
          </tr>
        </table>
      </div>`,
    ctaText: "Sign In to Your Account",
    ctaUrl: `${appUrl}/login`,
    secondaryNote: "If you have questions or need assistance with an order, our support team is available at support@medszop.com."
  });
}

function buildWelcomeEmailText(name = "Customer") {
  const appUrl = getFrontendUrl();
  return `Welcome to MedsZop, ${name}

Your account is now active. MedsZop connects you with licensed local pharmacies, verified diagnostic services, and board-certified healthcare professionals through a single, secure platform.

You can now upload prescriptions, order medications directly from verified dispensaries, and access digital consultations whenever you need care.

Account Capabilities:
- Prescription Review: Upload prescriptions for direct pharmacist verification.
- Licensed Dispensaries: Orders are fulfilled only by state-licensed partner pharmacies.
- Order Tracking: Live status updates from fulfillment to doorstep handover.

Sign in to your account: ${appUrl}/login

If you need assistance, please contact support@medszop.com.

MedsZop Healthcare Technologies Private Limited
https://medszop.com`;
}

/* =============================================================================
 * 2. REGISTRATION OTP EMAIL
 * ============================================================================= */
function buildOTPEmailHTML(otp) {
  return renderBaseEmailLayout({
    previewText: `Your MedsZop verification code is ${otp}. Valid for 5 minutes.`,
    title: "MedsZop Verification Code",
    heading: "Verification Code",
    introText: "Please use the one-time verification code below to verify your email address. This code is valid for 5 minutes.",
    childrenHtml: renderCodeBlock(otp, "One-Time Password", "Expires in 5 minutes"),
    secondaryNote: "For your security, never share this code with anyone. MedsZop representatives will never ask for your verification code."
  });
}

function buildOTPEmailText(otp) {
  return `MedsZop Verification Code

Your verification code is: ${otp}

This code is valid for 5 minutes. Please enter it to complete your verification.

For your security, never share this code with anyone. MedsZop representatives will never ask for your verification code.

MedsZop Healthcare Technologies Private Limited
support@medszop.com`;
}

/* =============================================================================
 * 3. PASSWORD RESET OTP EMAIL
 * ============================================================================= */
function buildPasswordResetEmailHTML(otp) {
  return renderBaseEmailLayout({
    previewText: `Your MedsZop password reset code is ${otp}. Valid for 10 minutes.`,
    title: "Reset Your MedsZop Password",
    heading: "Password Reset Request",
    introText: "We received a request to reset the password for your MedsZop account. Use the one-time verification code below to proceed.",
    childrenHtml: renderCodeBlock(otp, "Password Reset Code", "Expires in 10 minutes"),
    secondaryNote: "If you did not request a password reset, your account remains secure. You can safely disregard this email or contact support@medszop.com if you suspect unauthorized activity."
  });
}

function buildPasswordResetEmailText(otp) {
  return `Password Reset Request — MedsZop

Your password reset verification code is: ${otp}

This code is valid for 10 minutes.

If you did not request this password reset, please ignore this email. Your account remains secure.

MedsZop Healthcare Technologies Private Limited
support@medszop.com`;
}

/* =============================================================================
 * 4. ORDER PLACED EMAIL
 * ============================================================================= */
function buildOrderPlacedEmail(name = "Customer", orderIdNumber) {
  const appUrl = getFrontendUrl();
  return renderBaseEmailLayout({
    previewText: `Order #${orderIdNumber} has been received and forwarded to the dispensing pharmacy.`,
    title: `Order Received — #${orderIdNumber}`,
    heading: "Order Received",
    introText: `Hello ${name}, thank you for your order. We have received order #${orderIdNumber} and forwarded it to the licensed dispensing pharmacy for review and fulfillment.`,
    metadataRows: [
      { label: "Order Reference", value: `#${orderIdNumber}`, mono: true },
      { label: "Current Status", value: "Under Pharmacy Review" },
      { label: "Payment Verification", value: "Confirmed" }
    ],
    childrenHtml: `
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
        A registered pharmacist will verify medicine availability and regulatory requirements before packing your order. You will receive an immediate confirmation once accepted.
      </p>`,
    ctaText: "Track Order Status",
    ctaUrl: `${appUrl}/orders/${orderIdNumber}`,
    secondaryNote: "Questions regarding your order? Reach our support desk at support@medszop.com with your order reference."
  });
}

function buildOrderPlacedEmailText(name = "Customer", orderIdNumber) {
  const appUrl = getFrontendUrl();
  return `Order Received — #${orderIdNumber}

Hello ${name},

Thank you for your order. We have received order #${orderIdNumber} and forwarded it to the licensed dispensing pharmacy for review and fulfillment.

Order Reference: #${orderIdNumber}
Current Status: Under Pharmacy Review

Track your order: ${appUrl}/orders/${orderIdNumber}

If you have questions, contact support@medszop.com.

MedsZop Healthcare Technologies Private Limited`;
}

/* =============================================================================
 * 5. ORDER CONFIRMED EMAIL
 * ============================================================================= */
function buildOrderConfirmedEmail(name = "Customer", orderIdNumber) {
  const appUrl = getFrontendUrl();
  return renderBaseEmailLayout({
    previewText: `Order #${orderIdNumber} is confirmed and currently being prepared.`,
    title: `Order Confirmed — #${orderIdNumber}`,
    heading: "Order Confirmed by Pharmacy",
    introText: `Hello ${name}, the dispensing pharmacy has accepted order #${orderIdNumber}. Your medications are currently being packed in accordance with regulatory pharmacy standards.`,
    metadataRows: [
      { label: "Order Reference", value: `#${orderIdNumber}`, mono: true },
      { label: "Current Status", value: "Confirmed & Packing" }
    ],
    childrenHtml: `
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
        A delivery partner will be dispatched as soon as the pharmacy completes packaging. You can monitor the live delivery timeline in your account.
      </p>`,
    ctaText: "Track Live Status",
    ctaUrl: `${appUrl}/orders/${orderIdNumber}`
  });
}

function buildOrderConfirmedEmailText(name = "Customer", orderIdNumber) {
  const appUrl = getFrontendUrl();
  return `Order Confirmed — #${orderIdNumber}

Hello ${name},

The dispensing pharmacy has accepted order #${orderIdNumber}. Your medications are being packed in accordance with regulatory standards.

Order Reference: #${orderIdNumber}
Status: Confirmed & Packing

Track live status: ${appUrl}/orders/${orderIdNumber}

MedsZop Healthcare Technologies Private Limited
support@medszop.com`;
}

/* =============================================================================
 * 6. ORDER CANCELLED EMAIL
 * ============================================================================= */
function buildOrderCancelledEmail(name = "Customer", orderIdNumber, reason = "Stock unavailability at dispensary") {
  const appUrl = getFrontendUrl();
  return renderBaseEmailLayout({
    previewText: `Order #${orderIdNumber} could not be fulfilled and has been cancelled.`,
    title: `Order Cancellation Notice — #${orderIdNumber}`,
    heading: "Order Cancellation Notice",
    introText: `Hello ${name}, we regret to inform you that order #${orderIdNumber} could not be completed and has been cancelled.`,
    metadataRows: [
      { label: "Order Reference", value: `#${orderIdNumber}`, mono: true },
      { label: "Cancellation Reason", value: reason },
      { label: "Refund Status", value: "Initiated (3-5 business days)" }
    ],
    childrenHtml: `
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
        If payment was collected for this order, a full refund has been initiated to your original payment method. Depending on your financial institution, funds typically reflect within 3 to 5 business days.
      </p>`,
    ctaText: "View Your Account",
    ctaUrl: `${appUrl}/orders`,
    secondaryNote: "If you need immediate assistance finding alternative pharmacy availability, our support team is available at support@medszop.com."
  });
}

function buildOrderCancelledEmailText(name = "Customer", orderIdNumber, reason = "Stock unavailability at dispensary") {
  const appUrl = getFrontendUrl();
  return `Order Cancellation Notice — #${orderIdNumber}

Hello ${name},

We regret to inform you that order #${orderIdNumber} could not be completed and has been cancelled.

Order Reference: #${orderIdNumber}
Cancellation Reason: ${reason}
Refund Status: Initiated (3-5 business days)

If payment was collected, a full refund has been initiated to your original payment method.

View your account: ${appUrl}/orders

Contact support@medszop.com for assistance.

MedsZop Healthcare Technologies Private Limited`;
}

/* =============================================================================
 * 7. ORDER DELIVERED EMAIL
 * ============================================================================= */
function buildOrderDeliveredEmail(name = "Customer", orderIdNumber) {
  const appUrl = getFrontendUrl();
  return renderBaseEmailLayout({
    previewText: `Order #${orderIdNumber} has been successfully delivered.`,
    title: `Order Delivered — #${orderIdNumber}`,
    heading: "Delivery Confirmation",
    introText: `Hello ${name}, order #${orderIdNumber} has been successfully delivered to your specified address.`,
    metadataRows: [
      { label: "Order Reference", value: `#${orderIdNumber}`, mono: true },
      { label: "Fulfillment Status", value: "Delivered" }
    ],
    childrenHtml: `
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
        Please inspect the package to confirm all tamper-evident seals are intact. If you notice any discrepancy or damaged packaging, report it immediately through your account.
      </p>`,
    ctaText: "View Order Receipt",
    ctaUrl: `${appUrl}/orders/${orderIdNumber}`,
    secondaryNote: "Thank you for choosing MedsZop for your healthcare needs. For clinical support or queries, reach us at support@medszop.com."
  });
}

function buildOrderDeliveredEmailText(name = "Customer", orderIdNumber) {
  const appUrl = getFrontendUrl();
  return `Delivery Confirmation — #${orderIdNumber}

Hello ${name},

Order #${orderIdNumber} has been successfully delivered to your specified address.

Order Reference: #${orderIdNumber}
Status: Delivered

Please inspect the package to confirm tamper-evident seals are intact.

View receipt: ${appUrl}/orders/${orderIdNumber}

MedsZop Healthcare Technologies Private Limited
support@medszop.com`;
}

/* =============================================================================
 * 8. PHARMACY NEW ORDER NOTIFICATION
 * ============================================================================= */
function buildPharmacyOrderReceivedEmail(pharmacyName = "Pharmacy Partner", orderId) {
  const pharmacyUrl = getPharmacyUrl();
  return renderBaseEmailLayout({
    previewText: `New order #${orderId} requires dispensary review and acceptance.`,
    title: `New Dispensing Order — #${orderId}`,
    heading: "New Order for Fulfillment",
    introText: `Hello ${pharmacyName}, a new patient order has been routed to your dispensary.`,
    metadataRows: [
      { label: "Order ID", value: `#${orderId}`, mono: true },
      { label: "Action Required", value: "Verify Stock & Accept" }
    ],
    childrenHtml: `
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
        Please inspect the order in your pharmacy portal, verify medication batch availability, and update the order status promptly to ensure compliance with delivery SLAs.
      </p>`,
    ctaText: "Open Pharmacy Portal",
    ctaUrl: `${pharmacyUrl}/orders/${orderId}`
  });
}

function buildPharmacyOrderReceivedEmailText(pharmacyName = "Pharmacy Partner", orderId) {
  const pharmacyUrl = getPharmacyUrl();
  return `New Order for Fulfillment — #${orderId}

Hello ${pharmacyName},

A new patient order #${orderId} has been routed to your dispensary. Please inspect the items and confirm fulfillment in your dashboard.

Open Pharmacy Portal: ${pharmacyUrl}/orders/${orderId}

MedsZop Pharmacy Operations
support@medszop.com`;
}

/* =============================================================================
 * 9. DELIVERY COURIER REQUEST
 * ============================================================================= */
function buildDeliveryRequestEmail(partnerName = "Delivery Partner", orderId, pickupLoc = "Pharmacy Location", dropoffLoc = "Patient Address") {
  const deliveryUrl = getDeliveryUrl();
  return renderBaseEmailLayout({
    previewText: `Delivery dispatch assignment available for Order #${orderId}.`,
    title: `Delivery Dispatch — Order #${orderId}`,
    heading: "Delivery Assignment Available",
    introText: `Hello ${partnerName}, an order has been prepared and is ready for courier pickup.`,
    metadataRows: [
      { label: "Order Reference", value: `#${orderId}`, mono: true },
      { label: "Pickup Location", value: pickupLoc },
      { label: "Delivery Destination", value: dropoffLoc }
    ],
    childrenHtml: `
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
        Please review the dispatch details in your delivery app and update your status upon collection.
      </p>`,
    ctaText: "View Dispatch in App",
    ctaUrl: `${deliveryUrl}/orders/${orderId}`
  });
}

function buildDeliveryRequestEmailText(partnerName = "Delivery Partner", orderId, pickupLoc = "Pharmacy", dropoffLoc = "Address") {
  const deliveryUrl = getDeliveryUrl();
  return `Delivery Assignment — Order #${orderId}

Hello ${partnerName},

An order is ready for courier pickup.

Order Reference: #${orderId}
Pickup Location: ${pickupLoc}
Delivery Destination: ${dropoffLoc}

View details: ${deliveryUrl}/orders/${orderId}

MedsZop Logistics
support@medszop.com`;
}

/* =============================================================================
 * 10. PARTNER APPLICATION SUBMITTED
 * ============================================================================= */
function buildApplicationSubmittedEmail(name = "Applicant", role = "Partner", appId) {
  const appUrl = getFrontendUrl();
  return renderBaseEmailLayout({
    previewText: `Your application for ${role} has been received and is under review.`,
    title: "Application Received — MedsZop Partner Network",
    heading: "Application Under Review",
    introText: `Dear ${name}, thank you for applying to join the MedsZop healthcare provider network as a licensed ${role}.`,
    metadataRows: [
      { label: "Application ID", value: String(appId), mono: true },
      { label: "Professional Role", value: role },
      { label: "Verification Status", value: "Pending Credential Review" }
    ],
    childrenHtml: `
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
        Our clinical compliance team reviews all professional credentials and licenses prior to onboarding. You will be notified once credential verification is complete.
      </p>`,
    ctaText: "Track Application Status",
    ctaUrl: `${appUrl}/application-status/${appId}`
  });
}

function buildApplicationSubmittedEmailText(name = "Applicant", role = "Partner", appId) {
  const appUrl = getFrontendUrl();
  return `Application Received — MedsZop Partner Network

Dear ${name},

Thank you for applying to join the MedsZop provider network as a licensed ${role}.

Application ID: ${appId}
Role: ${role}
Status: Pending Credential Review

Track your application status: ${appUrl}/application-status/${appId}

MedsZop Clinical Compliance
support@medszop.com`;
}

/* =============================================================================
 * 11. PARTNER APPLICATION APPROVED
 * ============================================================================= */
function buildApplicationApprovedEmail(name = "Applicant", role = "Partner", email, tempPassword) {
  const appUrl = getFrontendUrl();
  return renderBaseEmailLayout({
    previewText: `Your MedsZop provider application for ${role} has been approved.`,
    title: "Application Approved — Welcome to MedsZop",
    heading: "Provider Account Provisioned",
    introText: `Dear ${name}, we are pleased to confirm that your application to practice as a verified ${role} on MedsZop has been approved following credential verification.`,
    metadataRows: [
      { label: "Designated Role", value: role },
      { label: "Registered Email", value: email },
      { label: "Temporary Access Key", value: tempPassword, mono: true }
    ],
    childrenHtml: `
      <div style="margin: 20px 0; padding: 14px 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; line-height: 1.5; color: #475569;">
        <strong style="color: #0f172a;">Security Requirement:</strong> You must change your temporary password immediately upon your first sign-in.
      </div>`,
    ctaText: "Sign In to Provider Portal",
    ctaUrl: `${appUrl}/login`,
    secondaryNote: "If you have questions regarding onboarding or clinical protocols, please reach out to our provider relations desk at support@medszop.com."
  });
}

function buildApplicationApprovedEmailText(name = "Applicant", role = "Partner", email, tempPassword) {
  const appUrl = getFrontendUrl();
  return `Application Approved — Welcome to MedsZop

Dear ${name},

Your application to practice as a verified ${role} on MedsZop has been approved. Your provider account is now active.

Login Credentials:
Registered Email: ${email}
Temporary Access Key: ${tempPassword}

Security Requirement: You must change your temporary password immediately upon first sign-in.

Sign in to provider portal: ${appUrl}/login

MedsZop Provider Relations
support@medszop.com`;
}

/* =============================================================================
 * 12. PARTNER APPLICATION REJECTED
 * ============================================================================= */
function buildApplicationRejectedEmail(name = "Applicant", role = "Partner", reason = "License credentials could not be verified") {
  return renderBaseEmailLayout({
    previewText: `Application update regarding your ${role} submission.`,
    title: "Application Status Update — MedsZop",
    heading: "Application Status Update",
    introText: `Dear ${name}, thank you for your interest in joining the MedsZop healthcare provider network as a ${role}.`,
    metadataRows: [
      { label: "Target Role", value: role },
      { label: "Review Outcome", value: "Not Approved" },
      { label: "Details", value: reason }
    ],
    childrenHtml: `
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
        Following review by our compliance team, we are unable to accept your application at this time based on the criteria outlined above. You may submit an updated application once the stated prerequisites are addressed.
      </p>`,
    secondaryNote: "If you believe this outcome was reached in error, you may submit supplemental licensing documentation to support@medszop.com."
  });
}

function buildApplicationRejectedEmailText(name = "Applicant", role = "Partner", reason = "Credential verification") {
  return `Application Status Update — MedsZop

Dear ${name},

Thank you for your interest in joining the MedsZop network as a ${role}.

Following review by our compliance team, we are unable to accept your application at this time.

Reason: ${reason}

You may submit supplemental licensing documentation to support@medszop.com if you believe this was in error.

MedsZop Clinical Compliance
support@medszop.com`;
}

module.exports = {
  renderBaseEmailLayout,
  renderCodeBlock,

  // 1. Customer Welcome
  buildWelcomeEmailHTML,
  buildWelcomeEmailText,

  // 2. Registration OTP
  buildOTPEmailHTML,
  buildOTPEmailText,

  // 3. Password Reset OTP
  buildPasswordResetEmailHTML,
  buildPasswordResetEmailText,

  // 4. Order Placed
  buildOrderPlacedEmail,
  buildOrderPlacedEmailText,

  // 5. Order Confirmed
  buildOrderConfirmedEmail,
  buildOrderConfirmedEmailText,

  // 6. Order Cancelled
  buildOrderCancelledEmail,
  buildOrderCancelledEmailText,

  // 7. Order Delivered
  buildOrderDeliveredEmail,
  buildOrderDeliveredEmailText,

  // 8. Pharmacy Order Notification
  buildPharmacyOrderReceivedEmail,
  buildPharmacyOrderReceivedEmailText,

  // 9. Delivery Courier Notification
  buildDeliveryRequestEmail,
  buildDeliveryRequestEmailText,

  // 10. Application Submitted
  buildApplicationSubmittedEmail,
  buildApplicationSubmittedEmailText,

  // 11. Application Approved
  buildApplicationApprovedEmail,
  buildApplicationApprovedEmailText,

  // 12. Application Rejected
  buildApplicationRejectedEmail,
  buildApplicationRejectedEmailText
};

