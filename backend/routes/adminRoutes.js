const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const { stats } = require("../controllers/adminController");

// Only Admin Access
router.get("/stats", auth, role(["admin"]), stats);

module.exports = router;
