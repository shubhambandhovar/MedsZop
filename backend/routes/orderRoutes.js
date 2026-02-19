const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  requestReturn
} = require("../controllers/orderController");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.post("/", auth, createOrder);
router.get("/", auth, getOrders);
router.get("/:id", auth, getOrderById);
router.put("/:id/status", auth, role(["admin", "pharmacy", "delivery"]), updateOrderStatus);
router.post("/:id/cancel", auth, cancelOrder);
router.post("/:id/return", auth, requestReturn);

module.exports = router;
