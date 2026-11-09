const path = require("path");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Prescription = require("../models/Prescription");
const Order = require("../models/Order");
const Pharmacy = require("../models/Pharmacy");
const Consultation = require("../models/Consultation");
const { escapeRegex } = require("../middleware/sanitizeMiddleware");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * ============================================================
 * SCAN PRESCRIPTION (Gemini Vision AI)
 * ============================================================
 */
exports.scanPrescription = async (req, res) => {
  try {
    const { base64Image } = req.body;

    // 1. Validate input
    if (!base64Image || typeof base64Image !== "string") {
      return res.status(400).json({ message: "No image provided" });
    }

    // 2. Prepare Gemini Vision
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    // Remove data:image/jpeg;base64, prefix if exists
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `
    You are an expert medical pharmacist. Analyze this prescription image (which might be handwritten) and extract all medicines listed.
    
    Return ONLY valid JSON in this format:
    {
      "medicines": [
        {
          "name": "Full name of the medicine",
          "dosage": "e.g., 500mg",
          "frequency": "e.g., twice a day",
          "duration": "e.g., 5 days"
        }
      ]
    }
    
    If it's handwritten, look closely at the medication names. If no medicines are found, return an empty list.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      }
    ]);

    const textOutput = result.response.text();

    // 3. SAFE JSON extraction
    let parsed = { medicines: [] };
    try {
      const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0].trim());
      }
    } catch (err) {
      console.error("❌ Gemini Vision JSON parse failed", textOutput);
    }

    // 4. Response
    return res.json({
      rawText: "Extracted via Gemini Vision",
      parsed
    });

  } catch (error) {
    console.error("❌ Prescription scan error:", error);
    return res.status(500).json({
      message: "Prescription scanning failed",
      error: error.message
    });
  }
};

/**
 * ============================================================
 * UPLOAD PRESCRIPTION (SEC-04)
 * ============================================================
 * - Requires authenticated user (req.user)
 * - Associates prescription with user_id
 * - Stores metadata in MongoDB Prescription collection
 */
exports.uploadPrescription = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No prescription file uploaded" });
    }

    // Standardize URL path with forward slashes for cross-platform compatibility
    const filePath = req.file.path.replace(/\\/g, "/");

    // Save prescription record tied to authenticated user
    const prescription = await Prescription.create({
      user_id: req.user.id,
      file_url: filePath,
      filename: req.file.filename,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      file_size: req.file.size,
      status: "uploaded"
    });

    return res.status(201).json({
      success: true,
      message: "Prescription uploaded successfully",
      filePath: filePath,
      prescriptionId: prescription._id
    });
  } catch (error) {
    console.error("Prescription upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error.message
    });
  }
};

/**
 * ============================================================
 * GET USER PRESCRIPTIONS (SEC-04 / Phase 9B.1)
 * ============================================================
 * - Customer sees only their own prescriptions
 * - Pharmacy sees prescriptions attached strictly to assigned orders
 * - Doctor sees prescriptions only for patients with active/completed consultations
 * - Admin sees all prescriptions
 */
exports.getUserPrescriptions = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id?.toString();

    let query = {};
    if (userRole === "admin") {
      query = {};
    } else if (userRole === "pharmacy") {
      const pharmacy = await Pharmacy.findOne({ user_id: userId });
      const pharmacyIdStr = pharmacy ? pharmacy._id.toString() : userId;

      // Phase 9B.1: Require explicit order assignment (no generic pending pool)
      const orders = await Order.find({
        pharmacy_id: pharmacyIdStr,
        prescription_url: { $exists: true, $ne: null }
      });
      const fileUrls = orders.map((o) => o.prescription_url).filter(Boolean);
      query = { file_url: { $in: fileUrls } };
    } else if (userRole === "doctor") {
      // Phase 9B.1: Require explicit consultation linkage
      const consultations = await Consultation.find({
        doctor_id: userId,
        status: { $in: ["ACCEPTED", "COMPLETED"] }
      });
      const patientIds = consultations.map((c) => c.patient_id.toString());
      const fileUrls = consultations.map((c) => c.prescription_url).filter(Boolean);
      query = {
        $or: [
          { user_id: { $in: patientIds } },
          { file_url: { $in: fileUrls } }
        ]
      };
    } else {
      // Customer or other role: access strictly limited to own uploads
      query = { user_id: userId };
    }

    const prescriptions = await Prescription.find(query).sort({ createdAt: -1 });
    return res.status(200).json(prescriptions);
  } catch (error) {
    console.error("Fetch prescriptions error:", error);
    return res.status(500).json({
      message: "Failed to fetch prescriptions",
      error: error.message
    });
  }
};

/**
 * ============================================================
 * GET PRESCRIPTION FILE (SEC-04 / Phase 9B.1)
 * ============================================================
 * - Requires authentication (req.user in Authorization header)
 * - Path traversal mitigation (basename check, containment validation)
 * - Strict role-based authorization (Least Privilege):
 *    * Admin: supervisory audit access
 *    * Customer: must own the prescription record or order
 *    * Pharmacy: must be explicitly assigned to an order with this prescription
 *    * Doctor: must have an active/completed consultation with patient
 *    * Delivery: strictly NO access (delivery OTP and address only)
 *    * Unassigned Pharmacy / Unrelated Doctor: 403 Forbidden
 * - Anti-sniffing, private non-cacheable headers
 */
exports.getPrescriptionFile = async (req, res) => {
  try {
    const rawFilename = req.params.filename;

    if (!rawFilename || typeof rawFilename !== "string") {
      return res.status(400).json({ message: "Filename parameter is required" });
    }

    // 1. Path traversal defense
    const sanitizedFilename = path.basename(rawFilename);
    if (
      sanitizedFilename !== rawFilename ||
      rawFilename.includes("..") ||
      rawFilename.includes("/") ||
      rawFilename.includes("\\") ||
      rawFilename.includes("\0")
    ) {
      return res.status(400).json({ message: "Invalid filename or path traversal detected" });
    }

    // 2. Directory containment & file resolution
    const uploadsDir = path.resolve(process.cwd(), "uploads", "prescriptions");
    const filePath = path.resolve(uploadsDir, sanitizedFilename);

    if (!filePath.startsWith(uploadsDir)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Prescription file not found" });
    }

    // 3. Ownership & Role-Based Authorization
    const userRole = req.user.role;
    const userId = req.user.id?.toString();
    const escapedFilename = escapeRegex(sanitizedFilename);

    let isAuthorized = false;

    // (A) Admin has supervisory audit access
    if (userRole === "admin") {
      isAuthorized = true;
    }

    // (B) Customer can access their own prescriptions
    if (!isAuthorized && userRole === "customer") {
      const rxDoc = await Prescription.findOne({
        $or: [
          { filename: sanitizedFilename },
          { file_url: { $regex: escapedFilename } }
        ],
        user_id: userId
      });

      if (rxDoc) {
        isAuthorized = true;
      } else {
        const orderDoc = await Order.findOne({
          user_id: userId,
          prescription_url: { $regex: escapedFilename }
        });
        if (orderDoc) {
          isAuthorized = true;
        }
      }
    }

    // (C) Pharmacy can ONLY access prescriptions for orders explicitly assigned to their pharmacy
    // (Phase 9B.1: Disallow unassigned pending order prescription harvesting)
    if (!isAuthorized && userRole === "pharmacy") {
      const pharmacy = await Pharmacy.findOne({ user_id: userId });
      const pharmacyIdStr = pharmacy ? pharmacy._id.toString() : userId;

      const orderDoc = await Order.findOne({
        pharmacy_id: pharmacyIdStr,
        prescription_url: { $regex: escapedFilename }
      });
      if (orderDoc) {
        isAuthorized = true;
      }
    }

    // (D) Doctor can ONLY access prescriptions if there is an active/completed consultation
    // (Phase 9B.1: Disallow unrelated doctors from inspecting arbitrary patient files)
    if (!isAuthorized && userRole === "doctor") {
      // 1. Check direct consultation prescription attachment
      const consultWithRx = await Consultation.findOne({
        doctor_id: userId,
        prescription_url: { $regex: escapedFilename },
        status: { $in: ["ACCEPTED", "COMPLETED"] }
      });

      if (consultWithRx) {
        isAuthorized = true;
      } else {
        // 2. Check if prescription belongs to a patient who has an active/completed consultation with this doctor
        const rxDoc = await Prescription.findOne({
          $or: [
            { filename: sanitizedFilename },
            { file_url: { $regex: escapedFilename } }
          ]
        });
        const orderDoc = !rxDoc ? await Order.findOne({ prescription_url: { $regex: escapedFilename } }) : null;
        const patientId = rxDoc?.user_id || orderDoc?.user_id;

        if (patientId) {
          const activeConsultation = await Consultation.findOne({
            doctor_id: userId,
            patient_id: patientId,
            status: { $in: ["ACCEPTED", "COMPLETED"] }
          });
          if (activeConsultation) {
            isAuthorized = true;
          }
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        message: "Forbidden: You are not authorized to view or download this prescription"
      });
    }

    // 4. Safe Content-Type determination
    const ext = path.extname(sanitizedFilename).toLowerCase();
    const mimeTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".pdf": "application/pdf"
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Content-Disposition", `inline; filename="${sanitizedFilename}"`);

    return res.sendFile(filePath);
  } catch (error) {
    console.error("Prescription file retrieval error:", error);
    return res.status(500).json({
      message: "Failed to retrieve prescription",
      error: error.message
    });
  }
};
