const express = require("express");
const router = express.Router();

const {
  getMedicines,
  getMedicineById,
  createMedicine
} = require("../controllers/medicineController");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.get("/", getMedicines);

router.get("/:id", getMedicineById);

router.post("/", auth, role(["admin", "pharmacy"]), createMedicine);

module.exports = router;
