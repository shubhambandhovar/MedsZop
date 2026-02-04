const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const {
  acceptDelivery,
  completeDelivery,
  getOrders
} = require("../controllers/deliveryController");

// Delivery Agent Only

router.get("/orders", auth, role(["delivery"]), getOrders);

router.post("/accept/:id", auth, role(["delivery"]), acceptDelivery);

router.post("/complete/:id", auth, role(["delivery"]), completeDelivery);

module.exports = router;
