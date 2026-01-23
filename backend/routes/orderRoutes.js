const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  updateOrderStatus
} = require("../controllers/orderController");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.post("/", auth, createOrder);

router.get("/", auth, getOrders);

router.put("/:id/status", auth, role(["admin","pharmacy","delivery"]), updateOrderStatus);

module.exports = router;
