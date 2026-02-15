const DoctorApplication = require("../models/DoctorApplication");
const PharmacistApplication = require("../models/PharmacistApplication");
const DeliveryApplication = require("../models/DeliveryApplication");
const User = require("../models/User");
const { sendEmail } = require("../utils/emailService");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Email Templates (Simulated for brevity)
const emailTemplates = {
    submitted: (name, role, appId) => `
    <h1>Application Received</h1>
    <p>Hi ${name},</p>
    <p>Your application for <strong>${role}</strong> at MedsZop has been submitted successfully.</p>
    <p>Current Status: <strong>PENDING</strong></p>
    <p>Track your status here: <a href="https://medszop.site/application-status/${appId}">Track Application</a></p>
  `,
    approved: (name, role, email, tempPassword) => `
    <h1>Application Approved!</h1>
    <p>Hi ${name},</p>
    <p>Congratulations! Your application for <strong>${role}</strong> has been approved.</p>
    <p><strong>Login Details:</strong></p>
    <p>Email: ${email}</p>
    <p>Temporary Password: <strong>${tempPassword}</strong></p>
    <p><a href="https://medszop.site/login">Login Here</a></p>
    <p><em>Please change your password immediately upon first login.</em></p>
  `,
    rejected: (name, role, reason) => `
    <h1>Application Status Update</h1>
    <p>Hi ${name},</p>
    <p>Regarding your application for <strong>${role}</strong>.</p>
    <p>Status: <strong>REJECTED</strong></p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>You may re-apply if you address the issues mentioned.</p>
  `
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
        await sendEmail(app.email, "Application Submitted - MedsZop",
            emailTemplates.submitted(app.name, "Doctor", app._id));

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

        await sendEmail(app.email, "Application Submitted - MedsZop",
            emailTemplates.submitted(app.owner_name, "Pharmacist", app._id));

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

        await sendEmail(app.email, "Application Submitted - MedsZop",
            emailTemplates.submitted(app.name, "Delivery Partner", app._id));

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
            await sendEmail(app.email, "Update on your MedsZop Application",
                emailTemplates.rejected(app.name || app.owner_name, role, remarks));

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
                is_first_login: false,
                authProvider: "local"
            });

            app.status = "APPROVED";
            app.user_id = newUser._id;
            await app.save();

            // Email
            await sendEmail(app.email, "Welcome to MedsZop! Application Approved",
                emailTemplates.approved(app.name || app.owner_name, role, app.email, tempPassword));

            return res.json({ message: "Application Approved & User Created" });
        }

        return res.status(400).json({ message: "Invalid action" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
