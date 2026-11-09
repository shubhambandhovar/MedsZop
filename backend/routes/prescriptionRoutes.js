const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const auth = require("../middleware/authMiddleware");
const {
  scanPrescription,
  uploadPrescription,
  getUserPrescriptions,
  getPrescriptionFile
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
    fileSize: 5 * 1024 * 1024 // 5 MB maximum
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|webp|pdf/;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const mimetype = allowedMimeTypes.includes(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    const err = new Error("Invalid file type. Only JPEG, PNG, WEBP, and PDF files under 5MB are allowed.");
    err.code = "INVALID_FILE_TYPE";
    cb(err);
  }
});

// Middleware to capture and format Multer errors cleanly
const handleUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File size exceeds 5MB limit" });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// AI Prescription Scanning
router.post("/scan", scanPrescription);

// Authenticated Prescription Management (SEC-04)
router.get("/", auth, getUserPrescriptions);
router.post("/upload", auth, handleUpload, uploadPrescription);
router.get("/file/:filename", auth, getPrescriptionFile);

module.exports = router;
