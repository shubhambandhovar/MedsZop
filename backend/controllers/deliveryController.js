const Order = require("../models/Order");

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [
        { delivery_agent_id: req.user.id },
        { delivery_agent_id: null, order_status: "processing" }
      ]
    }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.acceptDelivery = async (req, res) => {
  await Order.findByIdAndUpdate(req.params.id, {
    delivery_agent_id: req.user.id,
    order_status: "out_for_delivery"
  });
  res.json({ message: "Delivery accepted" });
};

exports.completeDelivery = async (req, res) => {
  await Order.findByIdAndUpdate(req.params.id, {
    order_status: "delivered"
  });
  res.json({ message: "Delivered" });
};
