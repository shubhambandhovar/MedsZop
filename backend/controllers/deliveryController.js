const Order = require("../models/Order");

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [
        { delivery_agent_id: req.user.id },
        {
          delivery_agent_id: null,
          $or: [
            { order_status: { $in: ["confirmed", "processing", "out_for_delivery"] } },
            { order_status: "pending", pharmacy_id: null }
          ]
        }
      ]
    }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.acceptDelivery = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.delivery_agent_id) return res.status(400).json({ message: "Order already accepted by another agent" });

    order.delivery_agent_id = req.user.id;
    order.order_status = "accepted";
    order.status_history.push({
      status: "accepted",
      timestamp: new Date()
    });

    await order.save();
    res.json({ message: "Delivery accepted", order });
  } catch (error) {
    res.status(500).json({ message: "Failed to accept delivery", error: error.message });
  }
};

exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.order_status = status;
    order.status_history.push({
      status: status,
      timestamp: new Date()
    });

    await order.save();
    res.json({ message: "Status updated", order });
  } catch (error) {
    res.status(500).json({ message: "Failed to update status", error: error.message });
  }
};

exports.completeDelivery = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.order_status = "delivered";
    order.status_history.push({
      status: "delivered",
      timestamp: new Date()
    });

    await order.save();
    res.json({ message: "Order delivered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to complete delivery", error: error.message });
  }
};
