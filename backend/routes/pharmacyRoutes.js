const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// Debug route
router.get("/ping", (req, res) => res.json({ message: "Pharmacy routes are working!" }));

const {
  registerPharmacy,
  getDashboard,
  getPharmacyOrders,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  updateProfile,
  bulkUploadMedicines
} = require("../controllers/pharmacyController");

// Register pharmacy
router.post("/register", auth, role(["pharmacy"]), registerPharmacy);

// Pharmacy dashboard
router.get("/dashboard", auth, role(["pharmacy", "admin"]), getDashboard);

// ✅ THIS IS REQUIRED
router.get("/orders", auth, role(["pharmacy"]), getPharmacyOrders);

router.post("/add-medicine", auth, role(["pharmacy"]), addMedicine);
router.post("/medicines/bulk-upload", auth, role(["pharmacy"]), upload.single("file"), bulkUploadMedicines);
router.put("/medicine/:id", auth, role(["pharmacy"]), updateMedicine);
router.delete("/medicine/:id", auth, role(["pharmacy"]), deleteMedicine);

// Profile
router.put("/profile", auth, role(["pharmacy"]), updateProfile);

module.exports = router;
