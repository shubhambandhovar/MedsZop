const express = require("express");
const router = express.Router();
const { scanPrescription } = require("../controllers/prescriptionController");

router.post("/scan", scanPrescription);

// Configure Multer for prescription uploads
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "uploads/prescriptions";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, "prescription-" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: File upload only supports following filetypes - " + filetypes));
    }
});

router.post("/upload", upload.single("file"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        // Return relative path for frontend/db usage
        // Windows backslashes need to be replaced for URLs
        const filePath = req.file.path.replace(/\\/g, "/");
        res.json({
            success: true,
            message: "Prescription uploaded successfully",
            filePath: filePath
        });
    } catch (error) {
        res.status(500).json({ message: "Upload failed", error: error.message });
    }
});

module.exports = router;
