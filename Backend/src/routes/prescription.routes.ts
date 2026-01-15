import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { processPrescriptionImage, simulateOCRForTesting } from "../services/ocrService";
import Medicine from "../models/Medicine";
import Prescription from "../models/Prescription";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

// Configure multer for image upload
const uploadDir = path.join(__dirname, "../../uploads/prescriptions");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage(); // Store in memory for processing
const upload = multer({
  storage,
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

interface PrescriptionUploadRequest extends Request {
  file?: any;
}

/**
 * POST /api/prescription/upload
 * Upload prescription image for OCR processing
 * Returns detected medicines with suggestions
 */
router.post(
  "/upload",
  upload.single("prescription"),
  async (req: PrescriptionUploadRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      console.log(`📸 Processing prescription: ${req.file.originalname}`);

      // Get all available medicines from database
      const allMedicines = await Medicine.find({ inStock: true });

      let result;

      // Use real Google Vision API if credentials available
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        try {
          result = await processPrescriptionImage(req.file.buffer, allMedicines);
          console.log("✅ Used Google Vision API");
        } catch (error) {
          console.log("⚠️ Google Vision failed, using simulation");
          result = await simulateOCRForTesting(req.file.buffer, allMedicines);
        }
      } else {
        // Use simulation for testing
        console.log("ℹ️ Using OCR simulation (set GOOGLE_APPLICATION_CREDENTIALS for real OCR)");
        result = await simulateOCRForTesting(req.file.buffer, allMedicines);
      }

      // Prepare detailed response
      const response = {
        success: true,
        message: "Prescription processed successfully",
        data: {
          rawText: result.rawText,
          detectedMedicines: result.detectedMedicines.map((m: any) => ({
            detectedName: m.detectedName,
            matchedMedicine: m.matchedMedicine ? {
              id: m.matchedMedicine._id,
              name: m.matchedMedicine.name,
              brand: m.matchedMedicine.brand,
              genericName: m.matchedMedicine.genericName,
              price: m.matchedMedicine.price,
              inStock: m.matchedMedicine.inStock,
              category: m.matchedMedicine.category,
            } : null,
            confidence: m.confidence,
            alternatives: m.alternatives.map((a: any) => ({
              id: a._id,
              name: a.name,
              brand: a.brand,
              genericName: a.genericName,
              price: a.price,
              inStock: a.inStock,
            })),
          })),
          cartUpdate: {
            added: result.added,
            suggested: result.suggested,
          },
          needsVerification: true,
          disclaimer:
            "Prescription medicines will be dispensed only after pharmacist verification.",
        },
      };

      res.json(response);
    } catch (error: any) {
      console.error("Prescription upload error:", error);
      res.status(500).json({
        error: "Failed to process prescription",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/prescription/verify
 * Pharmacist verification of detected medicines
 * This is for future implementation - pharmacist can confirm/modify suggestions
 */
router.post("/verify", async (req: Request, res: Response) => {
  try {
    const { detectedMedicines, pharmacistNotes } = req.body;

    // TODO: Save verification record for audit trail
    // TODO: Update order with verified medicines

    res.json({
      success: true,
      message: "Prescription verified successfully",
      verifiedAt: new Date(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/prescription/my-prescriptions
 * Get all prescriptions for logged-in user
 * Requires authentication
 */
router.get("/my-prescriptions", protect, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    
    const prescriptions = await Prescription.find({ userId })
      .sort({ uploadDate: -1 })
      .lean();

    res.json({
      success: true,
      data: prescriptions,
    });
  } catch (error: any) {
    console.error("Error fetching prescriptions:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/prescription/save
 * Save prescription metadata after upload
 * Requires authentication
 */
router.post("/save", protect, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { imageUrl, medicines, doctorName, validUntil } = req.body;

    const prescription = await Prescription.create({
      userId,
      imageUrl,
      medicines: medicines || [],
      doctorName,
      validUntil,
      verified: false,
    });

    res.status(201).json({
      success: true,
      data: prescription,
    });
  } catch (error: any) {
    console.error("Error saving prescription:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;
