const DoctorApplication = require("../models/DoctorApplication");
const PharmacistApplication = require("../models/PharmacistApplication");
const DeliveryApplication = require("../models/DeliveryApplication");
const User = require("../models/User");
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

// Backwards-compatible Email Templates object using the design system
const emailTemplates = {
    submitted: (name, role, appId) => buildApplicationSubmittedEmail(name, role, appId),
    approved: (name, role, email, tempPassword) => buildApplicationApprovedEmail(name, role, email, tempPassword),
    rejected: (name, role, reason) => buildApplicationRejectedEmail(name, role, reason)
};

/**
 * SUBMIT DOCTOR APPLICATION
 */
exports.submitDoctorCall = async (req, res) => {
    try {
        const exists = await User.findOne({ email: req.body.email });
        if (exists) return res.status(400).json({ message: "Email already registered as a user." });

        const app = await DoctorApplication.create(req.body);

        // Send Email
        await sendApplicationSubmittedEmail(app.email, app.name, "Doctor", app._id);

        res.status(201).json({ message: "Application submitted", applicationId: app._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * SUBMIT PHARMACIST APPLICATION
 */
exports.submitPharmacistCall = async (req, res) => {
    try {
        const exists = await User.findOne({ email: req.body.email });
        if (exists) return res.status(400).json({ message: "Email already registered as a user." });

        const app = await PharmacistApplication.create(req.body);

        await sendApplicationSubmittedEmail(app.email, app.owner_name, "Pharmacist", app._id);

        res.status(201).json({ message: "Application submitted", applicationId: app._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * SUBMIT DELIVERY APPLICATION
 */
exports.submitDeliveryCall = async (req, res) => {
    try {
        const exists = await User.findOne({ email: req.body.email });
        if (exists) return res.status(400).json({ message: "Email already registered as a user." });

        const app = await DeliveryApplication.create(req.body);

        await sendApplicationSubmittedEmail(app.email, app.name, "Delivery Partner", app._id);

        res.status(201).json({ message: "Application submitted", applicationId: app._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET APPLICATION STATUS (PUBLIC)
 */
exports.getApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        let app = await DoctorApplication.findById(id) ||
            await PharmacistApplication.findById(id) ||
            await DeliveryApplication.findById(id);

        if (!app) return res.status(404).json({ message: "Application not found" });

        // Determine role based on schema/fields
        let role = "Unknown";
        if (app.registration_number) role = "Doctor";
        else if (app.pharmacy_name) role = "Pharmacist";
        else if (app.vehicle_type) role = "Delivery Partner";

        res.json({
            applicant_name: app.name || app.owner_name,
            role,
            status: app.status,
            rejection_reason: app.rejection_reason,
            createdAt: app.createdAt
        });
    } catch (err) {
        res.status(500).json({ error: "Invalid ID format or Error" });
    }
};

/**
 * ADMIN: GET ALL APPLICATIONS (PENDING)
 */
exports.getApplications = async (req, res) => {
    try {
        const status = req.query.status || "PENDING";

        const [doctors, pharmacists, delivery] = await Promise.all([
            DoctorApplication.find({ status }),
            PharmacistApplication.find({ status }),
            DeliveryApplication.find({ status })
        ]);

        res.json({ doctors, pharmacists, delivery });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * ADMIN: REVIEW APPLICATION (APPROVE/REJECT)
 */
exports.reviewApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, remarks, role } = req.body; // action: "APPROVE" | "REJECT"

        let Model;
        if (role === "doctor") Model = DoctorApplication;
        else if (role === "pharmacist") Model = PharmacistApplication;
        else if (role === "delivery") Model = DeliveryApplication;
        else return res.status(400).json({ message: "Invalid role" });

        const app = await Model.findById(id);
        if (!app) return res.status(404).json({ message: "Application not found" });

        if (action === "REJECT") {
            app.status = "REJECTED";
            app.admin_remarks = remarks;
            app.rejection_reason = remarks;
            await app.save();

            // Email
            await sendApplicationRejectedEmail(app.email, app.name || app.owner_name, role, remarks);

            return res.json({ message: "Application Rejected" });
        }

        if (action === "APPROVE") {
            // Create User
            const tempPassword = crypto.randomBytes(4).toString("hex") + "#1A"; // Simple random
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            const newUser = await User.create({
                name: app.name || app.owner_name,
                email: app.email,
                phone: app.phone,
                password: hashedPassword,
                role: role === "pharmacist" ? "pharmacy" : role,
                is_first_login: true,
                authProvider: "local"
            });

            app.status = "APPROVED";
            app.user_id = newUser._id;
            await app.save();

            // Email
            await sendApplicationApprovedEmail(app.email, app.name || app.owner_name, role, app.email, tempPassword);

            return res.json({ message: "Application Approved & User Created" });
        }

        return res.status(400).json({ message: "Invalid action" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
