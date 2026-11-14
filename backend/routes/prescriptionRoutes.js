const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const { createRateLimiter } = require("../utils/rateLimiter");
const {
  scanPrescription,
  uploadPrescription,
  getUserPrescriptions,
  getPrescriptionFile,
  getReviewQueue,
  getPrescriptionReviewDetails,
  submitPrescriptionReview
} = require("../controllers/prescriptionController");

// Configure secure Multer storage for prescription uploads (SEC-04)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve(process.cwd(), "uploads", "prescriptions");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeRandom = crypto.randomBytes(16).toString("hex");
    cb(null, `rx-${safeRandom}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB maximum for high-resolution prescription images & PDFs
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|webp|pdf/;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const mimetype = allowedMimeTypes.includes(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    const err = new Error("Invalid file type. Only JPEG, PNG, WEBP, and PDF files under 10MB are allowed.");
    err.code = "INVALID_FILE_TYPE";
    cb(err);
  }
});

// Middleware to capture and format Multer errors cleanly
const handleUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File size exceeds 10MB limit" });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// Optional upload handler for scan endpoint (supports both multipart and json base64)
const optionalUpload = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    return handleUpload(req, res, next);
  }
  next();
};

// Optional authentication middleware for scan endpoint (allows guest preview, associates if logged in)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch {
      // Ignore expired/invalid token for guest scan
    }
  }
  next();
};

// Rate limiter for scan endpoint: 15 requests per minute
const scanLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 15,
  message: "Prescription scanning rate limit reached. Please wait a moment before submitting another document."
});

// AI Prescription Scanning (V2 Multi-Engine with Quality Audit)
router.post("/scan", scanLimiter, optionalUpload, optionalAuth, scanPrescription);

// Pharmacist Verification Workstation Endpoints
router.get("/review-queue", auth, role(["pharmacy", "admin"]), getReviewQueue);
router.get("/:id/review-details", auth, role(["pharmacy", "admin", "customer"]), getPrescriptionReviewDetails);
router.post("/:id/review", auth, role(["pharmacy", "admin"]), submitPrescriptionReview);

// Authenticated Prescription Management (SEC-04)
router.get("/", auth, getUserPrescriptions);
router.post("/upload", auth, handleUpload, uploadPrescription);
router.get("/file/:filename", auth, getPrescriptionFile);

module.exports = router;
