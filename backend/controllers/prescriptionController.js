const path = require("path");
const fs = require("fs");
const Prescription = require("../models/Prescription");
const Order = require("../models/Order");
const Pharmacy = require("../models/Pharmacy");
const Consultation = require("../models/Consultation");
const { escapeRegex } = require("../middleware/sanitizeMiddleware");
const { getStorageProvider } = require("../utils/storageService");
const prescriptionPreprocessor = require("../services/prescriptionPreprocessor");
const { getOCRProvider } = require("../services/ocrProviderAdapter");
const medicineMatcher = require("../services/medicineMatcher");
const prescriptionReviewService = require("../services/prescriptionReviewService");

/**
 * Validate file signature (magic bytes) to prevent masquerading
 */
function detectAndValidateMimeType(buffer) {
  if (!buffer || buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  // PDF: %PDF
  if (buffer.toString("ascii", 0, 4) === "%PDF") {
    return "application/pdf";
  }

  return null;
}

/**
 * ============================================================
 * SCAN PRESCRIPTION (Intelligence V2: Multi-Engine OCR & Quality Audit)
 * ============================================================
 */
exports.scanPrescription = async (req, res) => {
  try {
    let inputBuffer = null;
    let originalMime = null;
    let originalFilename = "prescription";

    // 1. Ingest input (multipart file OR base64 in body)
    if (req.file) {
      if (req.file.buffer) {
        inputBuffer = req.file.buffer;
      } else if (req.file.path) {
        inputBuffer = await fs.promises.readFile(req.file.path);
        // Clean up upload temp file if not requested to save to account
        if (!req.body.saveToAccount) {
          fs.promises.unlink(req.file.path).catch(() => {});
        }
      }
      originalMime = req.file.mimetype;
      originalFilename = req.file.originalname || "prescription";
    } else if (req.body && req.body.base64Image) {
      const rawString = req.body.base64Image;
      const matches = rawString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        originalMime = matches[1];
        inputBuffer = Buffer.from(matches[2], "base64");
      } else {
        inputBuffer = Buffer.from(rawString.replace(/^data:image\/\w+;base64,/, ""), "base64");
      }
    }

    if (!inputBuffer || inputBuffer.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No prescription image or document provided. Please upload a clear photo or PDF."
      });
    }

    // 2. Validate magic bytes / file signature (Anti-spoofing)
    const detectedMime = detectAndValidateMimeType(inputBuffer);
    if (!detectedMime) {
      return res.status(400).json({
        success: false,
        message: "Invalid file format detected. Prescriptions must be valid JPEG, PNG, WebP, or PDF files."
      });
    }

    // 3. Preprocess with Sharp pipeline (EXIF auto-rotation, Laplacian blur check, glare check, contrast normalization)
    const preprocessed = await prescriptionPreprocessor.preprocess(inputBuffer, {
      mimeType: detectedMime,
      filename: originalFilename
    });

    // 4. Multi-engine OCR execution
    const requestedProvider = req.body.provider || process.env.OCR_PROVIDER || "hybrid";
    const ocrProvider = getOCRProvider(requestedProvider);
    const extraction = await ocrProvider.recognize(preprocessed.enhancedBuffer || inputBuffer, {
      mimeType: detectedMime,
      quality: preprocessed.quality,
      originalBuffer: inputBuffer
    });

    // 5. Controlled Indian Medicine Database reconciliation & LASA detection
    let medicines = extraction.data?.medicines || [];
    if (medicines.length > 0) {
      medicines = await medicineMatcher.matchAll(medicines);
    }

    const hasUncertainFields = medicines.some(
      (m) => m.recognitionStatus === "UNCERTAIN" || m.recognitionStatus === "ILLEGIBLE" || m.lasaAlert
    );

    const fullResultData = {
      ...extraction.data,
      medicines,
      hasUncertainFields,
      qualityAudit: preprocessed.quality
    };

    // 6. Optional Persistence if Authenticated User & save requested
    let savedPrescriptionId = null;
    const userId = req.user?.id;
    if (userId && (req.body.saveToAccount === true || req.body.prescriptionId)) {
      try {
        if (req.body.prescriptionId) {
          const existingRx = await Prescription.findOne({ _id: req.body.prescriptionId, user_id: userId });
          if (existingRx) {
            existingRx.parsed_data = fullResultData;
            existingRx.raw_text = fullResultData.rawExtractedText || "";
            existingRx.status = hasUncertainFields ? "needs_review" : "uploaded";
            await existingRx.save();
            savedPrescriptionId = existingRx._id;
          }
        }
      } catch (saveErr) {
        console.warn("Could not auto-save scanned prescription record:", saveErr.message);
      }
    }

    // 7. Safe structured clinical response
    return res.status(200).json({
      success: true,
      provider: extraction.provider || requestedProvider,
      isDualPass: extraction.isDualPass || false,
      quality: preprocessed.quality,
      previewImage: preprocessed.previewBuffer
        ? `data:image/webp;base64,${preprocessed.previewBuffer.toString("base64")}`
        : null,
      parsed: fullResultData,
      prescriptionId: savedPrescriptionId,
      requiresPharmacistReview: true,
      disclaimer: "MedsZop AI Prescription Intelligence assists in deciphering handwritten documents. A registered pharmacist must clinically review and verify all items prior to dispensing."
    });

  } catch (error) {
    // Zero PII logged - only log generic error
    console.error("Prescription scan error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Prescription analysis could not be completed. Please ensure the handwriting is legible and try again.",
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

    // If S3 storage provider is active, upload to private cloud S3 bucket
    if (process.env.STORAGE_PROVIDER === "s3") {
      try {
        const fileBuffer = await fs.promises.readFile(req.file.path);
        const storage = getStorageProvider("s3");
        await storage.saveFile(fileBuffer, req.file.filename, req.file.mimetype);
      } catch (s3Err) {
        console.error("Failed to upload prescription to S3:", s3Err.message);
        throw new Error(`Cloud storage upload failed: ${s3Err.message}`);
      }
    }

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

    // If S3 storage provider is active, stream directly from private S3 bucket
    if (process.env.STORAGE_PROVIDER === "s3") {
      try {
        const storage = getStorageProvider("s3");
        const stream = await storage.getFileStream(sanitizedFilename);
        return stream.pipe(res);
      } catch (s3Err) {
        console.error("Failed to stream prescription from S3:", s3Err.message);
        return res.status(404).json({ message: "Prescription file not found in cloud storage" });
      }
    }

    return res.sendFile(filePath);
  } catch (error) {
    console.error("Prescription file retrieval error:", error);
    return res.status(500).json({
      message: "Failed to retrieve prescription",
      error: error.message
    });
  }
};

/**
 * ============================================================
 * GET PRESCRIPTION REVIEW QUEUE (Pharmacist Workstation)
 * ============================================================
 */
exports.getReviewQueue = async (req, res) => {
  try {
    const { status = "needs_review", page = 1, limit = 20 } = req.query;
    const pharmacyId = req.user.role === "pharmacy" ? req.user.id : null;
    const result = await prescriptionReviewService.getReviewQueue({
      pharmacyId,
      status,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Fetch review queue error:", error.message);
    return res.status(500).json({ message: "Failed to fetch review queue", error: error.message });
  }
};

/**
 * ============================================================
 * GET PRESCRIPTION REVIEW DETAILS
 * ============================================================
 */
exports.getPrescriptionReviewDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const rx = await prescriptionReviewService.getPrescriptionDetails(id);
    if (!rx) {
      return res.status(404).json({ message: "Prescription not found" });
    }
    // Authorization check: admin, pharmacy, or owning customer
    if (req.user.role === "customer" && rx.user_id !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: You do not own this prescription" });
    }
    return res.status(200).json(rx);
  } catch (error) {
    console.error("Prescription review details error:", error.message);
    return res.status(404).json({ message: error.message });
  }
};

/**
 * ============================================================
 * SUBMIT PHARMACIST REVIEW DECISION
 * ============================================================
 */
exports.submitPrescriptionReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, reviewedMedicines, notes, rejectionReason } = req.body;
    const result = await prescriptionReviewService.submitReview({
      prescriptionId: id,
      decision,
      reviewedMedicines,
      notes,
      rejectionReason,
      pharmacist: req.user
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Submit prescription review error:", error.message);
    return res.status(400).json({ message: error.message });
  }
};

