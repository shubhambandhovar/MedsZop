const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const {
  stats,
  getAnalytics,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getUsers,
  getUserById,
  createUser,
  updateUserRole,
  updateUserStatus,
  checkUserDeletionDependencies,
  deleteUser,
  getPharmacies,
  verifyPharmacy,
  getPrescriptions,
  updatePrescriptionStatus,
  getConsultations,
  getDeliveries,
  getPartnerApplications,
  reviewPartnerApplication,
  getPayments,
  getRefunds,
  getAuditLogs,
  getSystemHealth
} = require("../controllers/adminController");

// All admin routes strictly enforce JWT auth + role(['admin'])
router.use(auth, role(["admin"]));

// 1. Overview & Analytics
router.get("/stats", stats);
router.get("/analytics", getAnalytics);

// 2. Orders
router.get("/orders", getOrders);
router.get("/orders/:id", getOrderById);
router.patch("/orders/:id/status", updateOrderStatus);

// 3. Medicine Catalog
router.get("/medicines", getMedicines);
router.post("/medicines", createMedicine);
router.put("/medicines/:id", updateMedicine);
router.delete("/medicines/:id", deleteMedicine);

// 4. User Directory & Lifecycle Management
router.get("/users", getUsers);
router.post("/create-user", createUser);
router.get("/users/:id", getUserById);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/status", updateUserStatus);
router.get("/users/:id/deletion-check", checkUserDeletionDependencies);
router.delete("/users/:id", deleteUser);

// 5. Pharmacies
router.get("/pharmacies", getPharmacies);
router.put("/pharmacies/:id/verify", verifyPharmacy);

// 6. Healthcare: Prescriptions & Consultations
router.get("/prescriptions", getPrescriptions);
router.patch("/prescriptions/:id/status", updatePrescriptionStatus);
router.get("/consultations", getConsultations);

// 7. Operations: Deliveries & Partner Applications
router.get("/deliveries", getDeliveries);
router.get("/partner-applications", getPartnerApplications);
router.post("/partner-applications/:type/:id/review", reviewPartnerApplication);

// 8. Business: Payments & Refunds
router.get("/payments", getPayments);
router.get("/refunds", getRefunds);

// 9. System: Audit Logs & Platform Health
router.get("/audit-logs", getAuditLogs);
router.get("/system-health", getSystemHealth);

module.exports = router;
