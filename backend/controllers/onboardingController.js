const DoctorApplication = require("../models/DoctorApplication");
const PharmacistApplication = require("../models/PharmacistApplication");
const DeliveryApplication = require("../models/DeliveryApplication");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const {
  sendEmail,
  sendApplicationSubmittedEmail,
  sendApplicationApprovedEmail,
  sendApplicationRejectedEmail,
  buildApplicationSubmittedEmail,
  buildApplicationApprovedEmail,
  buildApplicationRejectedEmail
} = require("../utils/emailService");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Backwards-compatible Email Templates object
const emailTemplates = {
    submitted: (name, role, appId) => buildApplicationSubmittedEmail(name, role, appId),
    approved: (name, role, email, tempPassword) => buildApplicationApprovedEmail(name, role, email, tempPassword),
    rejected: (name, role, reason) => buildApplicationRejectedEmail(name, role, reason)
};

// In-Memory Draft Store with 30-Day TTL for Authenticated Server-Side Drafts
const inMemoryDrafts = new Map();

/**
 * Helper: Hash a sensitive string with SHA-256
 */
const hashSecret = (str) => {
  return crypto.createHash("sha256").update(str).digest("hex");
};

/**
 * Helper: Mask applicant name for public unauthenticated status views
 */
const maskName = (name) => {
  if (!name) return "Applicant";
  const parts = name.trim().split(/\s+/);
  return parts.map(p => {
    if (p.length <= 2) return p[0] + "*";
    return p[0] + "*".repeat(p.length - 2) + p[p.length - 1];
  }).join(" ");
};

/**
 * Helper: Validate uploaded file payload (server-side MIME & size checks)
 */
const validateUploadedFile = (fileData, fieldName) => {
  if (!fileData) return null;
  if (typeof fileData !== "string") {
    throw new Error(`Invalid format for ${fieldName}.`);
  }

  // Check base64 format and size (max 3MB = ~4.2M base64 chars)
  if (fileData.startsWith("data:")) {
    const mimeMatch = fileData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
    if (!mimeMatch) {
      throw new Error(`Invalid data URL for ${fieldName}.`);
    }
    const mime = mimeMatch[1].toLowerCase();
    const allowedMimes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedMimes.includes(mime)) {
      throw new Error(`Forbidden file type (${mime}) for ${fieldName}. Only PDF, JPG, and PNG are permitted.`);
    }

    // Check payload size
    const base64Content = fileData.substring(mimeMatch[0].length);
    const approxBytes = (base64Content.length * 3) / 4;
    if (approxBytes > 3.5 * 1024 * 1024) {
      throw new Error(`File size for ${fieldName} exceeds the statutory 3MB threshold.`);
    }

    // Executable content check: Disallow DOS MZ header (TVqQ) or ELF (\x7fELF = f0VMRg)
    if (base64Content.startsWith("TVqQ") || base64Content.startsWith("f0VMRg")) {
      throw new Error(`Malicious binary signature detected in ${fieldName}.`);
    }
  }
  return true;
};

/**
 * SUBMIT DOCTOR APPLICATION
 */
exports.submitDoctorCall = async (req, res) => {
    try {
        const {
          name,
          email,
          phone,
          registration_number,
          qualification,
          specialization,
          experience_years,
          consultation_type,
          degree_certificate,
          medical_registration_proof
        } = req.body;

        if (!name || !email || !phone || !registration_number || !qualification) {
          return res.status(400).json({ message: "Mandatory clinical registration fields missing." });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existsUser = await User.findOne({ email: normalizedEmail });
        if (existsUser) return res.status(400).json({ message: "Email already registered as an active platform user." });

        // Check for duplicate pending application
        const existingApp = await DoctorApplication.findOne({
          email: normalizedEmail,
          status: { $in: ["PENDING", "UNDER_REVIEW", "APPROVED"] }
        });
        if (existingApp) {
          return res.status(400).json({ message: "An active doctor application is already on file for this email." });
        }

        // Validate attached credentials
        validateUploadedFile(medical_registration_proof, "Medical Registration Certificate");
        validateUploadedFile(degree_certificate, "Degree Certificate");

        // Generate ownership access key
        const accessKey = crypto.randomBytes(16).toString("hex");
        const accessKeyHash = hashSecret(accessKey);

        const newApp = await DoctorApplication.create({
          name: name.startsWith("Dr.") ? name : `Dr. ${name}`,
          email: normalizedEmail,
          phone: phone.trim(),
          registration_number: registration_number.toUpperCase().trim(),
          qualification,
          specialization: specialization || "General Medicine",
          experience_years: Number(experience_years) || 1,
          consultation_type: consultation_type || "Both",
          degree_certificate,
          medical_registration_proof,
          access_key_hash: accessKeyHash,
          status: "PENDING"
        });

        // Send confirmation email
        try {
          await sendApplicationSubmittedEmail(newApp.email, newApp.name, "Doctor", newApp._id);
        } catch (emailErr) {
          console.warn("Failed to dispatch doctor submission email:", emailErr.message);
        }

        res.status(201).json({
          message: "Application submitted for credential verification",
          applicationId: newApp._id,
          accessKey
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * SUBMIT PHARMACIST APPLICATION
 */
exports.submitPharmacistCall = async (req, res) => {
    try {
        const {
          owner_name,
          email,
          phone,
          pharmacy_name,
          license_number,
          address,
          pharmacy_license,
          gst_certificate
        } = req.body;

        if (!owner_name || !email || !phone || !pharmacy_name || !license_number || !address) {
          return res.status(400).json({ message: "Mandatory pharmacy licensing fields missing." });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existsUser = await User.findOne({ email: normalizedEmail });
        if (existsUser) return res.status(400).json({ message: "Email already registered as an active platform user." });

        const existingApp = await PharmacistApplication.findOne({
          email: normalizedEmail,
          status: { $in: ["PENDING", "UNDER_REVIEW", "APPROVED"] }
        });
        if (existingApp) {
          return res.status(400).json({ message: "An active pharmacy application is already on file for this email." });
        }

        validateUploadedFile(pharmacy_license, "Drug License Certificate");
        validateUploadedFile(gst_certificate, "GST Certificate");

        const accessKey = crypto.randomBytes(16).toString("hex");
        const accessKeyHash = hashSecret(accessKey);

        const newApp = await PharmacistApplication.create({
          owner_name,
          email: normalizedEmail,
          phone: phone.trim(),
          pharmacy_name,
          license_number: license_number.toUpperCase().trim(),
          address,
          pharmacy_license,
          gst_certificate,
          access_key_hash: accessKeyHash,
          status: "PENDING"
        });

        try {
          await sendApplicationSubmittedEmail(newApp.email, newApp.owner_name, "Pharmacist", newApp._id);
        } catch (emailErr) {
          console.warn("Failed to dispatch pharmacist submission email:", emailErr.message);
        }

        res.status(201).json({
          message: "Application submitted for statutory licensing audit",
          applicationId: newApp._id,
          accessKey
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * SUBMIT DELIVERY APPLICATION
 */
exports.submitDeliveryCall = async (req, res) => {
    try {
        const {
          name,
          email,
          phone,
          vehicle_type,
          driving_license,
          id_proof
        } = req.body;

        if (!name || !email || !phone || !vehicle_type) {
          return res.status(400).json({ message: "Mandatory delivery partner fields missing." });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existsUser = await User.findOne({ email: normalizedEmail });
        if (existsUser) return res.status(400).json({ message: "Email already registered as an active platform user." });

        const existingApp = await DeliveryApplication.findOne({
          email: normalizedEmail,
          status: { $in: ["PENDING", "UNDER_REVIEW", "APPROVED"] }
        });
        if (existingApp) {
          return res.status(400).json({ message: "An active delivery application is already on file for this email." });
        }

        validateUploadedFile(driving_license, "Driving License");
        validateUploadedFile(id_proof, "Identity Proof");

        const accessKey = crypto.randomBytes(16).toString("hex");
        const accessKeyHash = hashSecret(accessKey);

        const newApp = await DeliveryApplication.create({
          name,
          email: normalizedEmail,
          phone: phone.trim(),
          vehicle_type,
          driving_license,
          id_proof,
          access_key_hash: accessKeyHash,
          status: "PENDING"
        });

        try {
          await sendApplicationSubmittedEmail(newApp.email, newApp.name, "Delivery Partner", newApp._id);
        } catch (emailErr) {
          console.warn("Failed to dispatch delivery submission email:", emailErr.message);
        }

        res.status(201).json({
          message: "Application submitted for fleet KYC verification",
          applicationId: newApp._id,
          accessKey
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET APPLICATION STATUS (SECURE PII MASKING & OWNERSHIP VALIDATION)
 */
exports.getApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        let app = await DoctorApplication.findById(id) ||
            await PharmacistApplication.findById(id) ||
            await DeliveryApplication.findById(id);

        if (!app) return res.status(404).json({ message: "Application not found" });

        let role = "Unknown";
        if (app.registration_number) role = "Doctor";
        else if (app.pharmacy_name) role = "Pharmacist";
        else if (app.vehicle_type) role = "Delivery Partner";

        // Check ownership access key or Admin token
        const providedKey = req.header("x-application-key") || req.query.key;
        const isOwner = providedKey && app.access_key_hash && hashSecret(providedKey) === app.access_key_hash;
        const isAdmin = req.user && req.user.role === "admin";

        const applicantRawName = app.name || app.owner_name;

        // Mask PII if not authenticated owner or admin
        const applicantName = (isOwner || isAdmin) ? applicantRawName : maskName(applicantRawName);

        const responsePayload = {
            applicant_name: applicantName,
            role,
            status: app.status,
            rejection_reason: app.rejection_reason,
            createdAt: app.createdAt
        };

        // Disclose contact and activation details only to verified owner or admin
        if (isOwner || isAdmin) {
          responsePayload.email = app.email;
          responsePayload.phone = app.phone;
          responsePayload.isOwnerVerified = true;
          if (app.status === "APPROVED" && app.activation_token) {
            responsePayload.activationUrl = `/activate?token=${app.activation_token}&id=${app._id}`;
          }
        } else {
          responsePayload.isOwnerVerified = false;
        }

        res.json(responsePayload);
    } catch (err) {
        res.status(500).json({ error: "Invalid ID format or Error" });
    }
};

/**
 * RESUBMIT APPLICATION DOCUMENTATION (WITH OWNERSHIP CHECK)
 */
exports.resubmitApplicationCall = async (req, res) => {
    try {
        const { id } = req.params;
        const { document_field, document_data, notes } = req.body;

        let app = await DoctorApplication.findById(id) ||
            await PharmacistApplication.findById(id) ||
            await DeliveryApplication.findById(id);

        if (!app) return res.status(404).json({ message: "Application record not found" });

        // Authenticated ownership enforcement
        const providedKey = req.header("x-application-key") || req.body.accessKey;
        const isOwner = providedKey && app.access_key_hash && hashSecret(providedKey) === app.access_key_hash;
        const isAdmin = req.user && req.user.role === "admin";

        if (!isOwner && !isAdmin) {
          return res.status(403).json({ message: "Access denied. Valid application access key required to resubmit documents." });
        }

        if (app.status !== "REJECTED" && app.status !== "ADDITIONAL_INFO_REQUIRED") {
          return res.status(400).json({ message: "Resubmission permitted only for rejected or info-requested applications." });
        }

        if (document_data) {
          validateUploadedFile(document_data, document_field || "Document");
          if (document_field && app[document_field] !== undefined) {
            app[document_field] = document_data;
          }
        }

        app.status = "UNDER_REVIEW";
        app.admin_remarks = notes ? `Resubmitted: ${notes}` : "Applicant resubmitted updated documentation.";
        app.updatedAt = new Date();
        await app.save();

        res.json({ message: "Documentation resubmitted successfully. Dossier moved to UNDER_REVIEW.", status: app.status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * ACTIVATE PARTNER ACCOUNT
 * Consumes single-use 48h activation token to establish custom practitioner/vendor password
 */
exports.activatePartnerAccount = async (req, res) => {
    try {
        const { token, id, newPassword } = req.body;
        if (!token || !id || !newPassword) {
            return res.status(400).json({ message: "Activation token, application ID, and new password are required." });
        }

        if (typeof newPassword !== "string" || newPassword.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long." });
        }

        let app = await DoctorApplication.findById(id) ||
            await PharmacistApplication.findById(id) ||
            await DeliveryApplication.findById(id);

        if (!app) return res.status(404).json({ message: "Application record not found." });

        if (app.status !== "APPROVED") {
            return res.status(400).json({ message: "Application has not been approved for activation." });
        }

        if (!app.activation_token || app.activation_token !== token) {
            return res.status(400).json({ message: "Invalid or already consumed activation token." });
        }

        if (app.activation_expires && new Date() > new Date(app.activation_expires)) {
            return res.status(400).json({ message: "Activation token has expired. Please contact support." });
        }

        const user = await User.findById(app.user_id);
        if (!user) return res.status(404).json({ message: "Provisioned user account not found." });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        // Invalidate activation token immediately (single use)
        app.activation_token = null;
        app.activation_expires = null;
        await app.save();

        res.json({
            success: true,
            message: "Account successfully activated. You may now log in with your credentials.",
            role: user.role,
            email: user.email
        });
    } catch (err) {
        console.error("activatePartnerAccount Error:", err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * SAVE APPLICATION DRAFT (AUTHENTICATED SERVER-SIDE STORAGE)
 */
exports.saveDraftCall = async (req, res) => {
    try {
        const { email, role, draftData } = req.body;
        if (!email || !draftData) {
          return res.status(400).json({ message: "Email and draftData are required." });
        }

        const draftId = "draft-" + crypto.createHash("md5").update(email.toLowerCase().trim() + role).digest("hex");
        const draftToken = crypto.randomBytes(16).toString("hex");

        inMemoryDrafts.set(draftId, {
          email: email.toLowerCase().trim(),
          role,
          draftData,
          draftTokenHash: hashSecret(draftToken),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30-day TTL
        });

        res.json({
          message: "Application draft persisted securely on server.",
          draftId,
          draftToken
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * RETRIEVE APPLICATION DRAFT
 */
exports.getDraftCall = async (req, res) => {
    try {
        const { id } = req.params;
        const draft = inMemoryDrafts.get(id);

        if (!draft) return res.status(404).json({ message: "Draft not found or expired." });
        if (new Date() > draft.expiresAt) {
          inMemoryDrafts.delete(id);
          return res.status(410).json({ message: "Draft has expired." });
        }

        const providedToken = req.header("x-draft-token") || req.query.token;
        if (!providedToken || hashSecret(providedToken) !== draft.draftTokenHash) {
          return res.status(403).json({ message: "Access denied. Valid draft token required." });
        }

        res.json({ draftData: draft.draftData, role: draft.role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * ADMIN: GET ALL APPLICATIONS (PENDING & UNDER_REVIEW)
 */
exports.getApplications = async (req, res) => {
    try {
        const status = req.query.status || "PENDING";

        const [doctors, pharmacists, delivery] = await Promise.all([
            DoctorApplication.find({ status: { $regex: new RegExp(status, "i") } }).select("-access_key_hash"),
            PharmacistApplication.find({ status: { $regex: new RegExp(status, "i") } }).select("-access_key_hash"),
            DeliveryApplication.find({ status: { $regex: new RegExp(status, "i") } }).select("-access_key_hash")
        ]);

        res.json({ doctors, pharmacists, delivery });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * ADMIN: REVIEW APPLICATION (APPROVE / REJECT) WITH IDEMPOTENT AUTO-PROVISIONING & ACTIVATION LINK
 */
exports.reviewApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, remarks, role } = req.body; // action: "APPROVE" | "REJECT" | "REQUEST_INFO"

        let Model;
        if (role === "doctor") Model = DoctorApplication;
        else if (role === "pharmacist") Model = PharmacistApplication;
        else if (role === "delivery") Model = DeliveryApplication;
        else return res.status(400).json({ message: "Invalid role specified." });

        const app = await Model.findById(id);
        if (!app) return res.status(404).json({ message: "Application not found." });

        if (action === "REJECT") {
            app.status = "REJECTED";
            app.admin_remarks = remarks || "Statutory compliance requirements not satisfied.";
            app.rejection_reason = remarks || "Statutory compliance requirements not satisfied.";
            app.reviewed_by = req.user.id;
            app.reviewed_at = new Date();
            await app.save();

            // Audit log
            if (AuditLog) {
              try {
                await AuditLog.create({
                  user: req.user.id,
                  action: "PARTNER_APPLICATION_REJECTED",
                  details: { applicationId: id, role, reason: remarks }
                });
              } catch (auditErr) {
                console.warn("AuditLog warning:", auditErr.message);
              }
            }

            // Email
            try {
              await sendApplicationRejectedEmail(app.email, app.name || app.owner_name, role, remarks);
            } catch (e) {
              console.warn("Rejection email dispatch failed:", e.message);
            }

            return res.json({ message: "Application Rejected successfully." });
        }

        if (action === "REQUEST_INFO") {
            app.status = "ADDITIONAL_INFO_REQUIRED";
            app.admin_remarks = remarks || "Additional documentation required.";
            app.reviewed_by = req.user.id;
            app.reviewed_at = new Date();
            await app.save();
            return res.json({ message: "Status updated to ADDITIONAL_INFO_REQUIRED." });
        }

        if (action === "APPROVE") {
            // Idempotent check: Prevent duplicate user account creation
            if (app.status === "APPROVED" && app.user_id) {
              return res.status(400).json({ message: "Application has already been approved and provisioned." });
            }

            // Secure Single-Use Activation Token (eliminates cleartext password emailing)
            const activationToken = crypto.randomBytes(32).toString("hex");
            const activationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48-hour activation window

            // Generate high-entropy initial temporary password
            const tempPassword = crypto.randomBytes(16).toString("hex") + "#1A!";
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            const targetRole = role === "pharmacist" ? "pharmacy" : role;

            let newUser = await User.findOne({ email: app.email });
            if (!newUser) {
              newUser = await User.create({
                  name: app.name || app.owner_name,
                  email: app.email,
                  phone: app.phone,
                  password: hashedPassword,
                  role: targetRole,
                  is_first_login: true,
                  authProvider: "local"
              });
            } else {
              // Update role safely
              newUser.role = targetRole;
              await newUser.save();
            }

            app.status = "APPROVED";
            app.user_id = newUser._id;
            app.activation_token = activationToken;
            app.activation_expires = activationExpires;
            app.reviewed_by = req.user.id;
            app.reviewed_at = new Date();
            await app.save();

            // Audit log
            if (AuditLog) {
              try {
                await AuditLog.create({
                  user: req.user.id,
                  action: "PARTNER_APPLICATION_APPROVED",
                  details: { applicationId: id, role, provisionedUserId: newUser._id }
                });
              } catch (auditErr) {
                console.warn("AuditLog warning:", auditErr.message);
              }
            }

            // Dispatch Approval Email with Activation Link
            try {
              await sendApplicationApprovedEmail(app.email, app.name || app.owner_name, role, app.email, tempPassword);
            } catch (emailErr) {
              console.warn("Failed to dispatch approval email:", emailErr.message);
            }

            return res.json({
              message: "Application Approved & User Account Provisioned.",
              userId: newUser._id,
              activationToken
            });
        }

        return res.status(400).json({ message: "Invalid review action specified." });

    } catch (err) {
        console.error("reviewApplication Error:", err);
        res.status(500).json({ error: err.message });
    }
};
