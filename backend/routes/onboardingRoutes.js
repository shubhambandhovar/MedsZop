const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const {
    submitDoctorCall,
    submitPharmacistCall,
    submitDeliveryCall,
    getApplicationStatus,
    getApplications,
    reviewApplication
} = require("../controllers/onboardingController");

// Public Routes
router.post("/apply/doctor", submitDoctorCall);
router.post("/apply/pharmacist", submitPharmacistCall);
router.post("/apply/delivery", submitDeliveryCall);
router.get("/status/:id", getApplicationStatus);

// Admin Routes (Protected)
router.get("/admin/applications", auth, role(["admin"]), getApplications);
router.post("/admin/review/:id", auth, role(["admin"]), reviewApplication);

module.exports = router;
