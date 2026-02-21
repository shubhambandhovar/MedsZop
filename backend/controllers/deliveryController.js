const Order = require("../models/Order");
const User = require("../models/User");
const { sendOrderDeliveredEmail } = require("../utils/emailService");

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
    }).sort({ createdAt: -1 }).lean();

    // Manual populate for pharmacy details
    const Pharmacy = require("../models/Pharmacy");
    const pharmacyIds = orders.map(o => o.pharmacy_id).filter(id => id);
    const pharmacies = await Pharmacy.find({ _id: { $in: pharmacyIds } });
    const pharmacyMap = {};
    pharmacies.forEach(p => pharmacyMap[p._id.toString()] = p);

    const ordersWithPharmacy = orders.map(o => ({
      ...o,
      pharmacy: pharmacyMap[o.pharmacy_id] || null
    }));

    res.json(ordersWithPharmacy);
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

    // Validate OTP
    if (order.delivery_otp) {
      if (!req.body.otp || req.body.otp.toString() !== order.delivery_otp.toString()) {
        return res.status(400).json({ message: "Invalid OTP. Delivery verification failed." });
      }
    }

    order.order_status = "delivered";
    if (order.payment_method === "cod" && order.payment_status === "pending") {
      order.payment_status = "paid";
    }
    order.status_history.push({
      status: "delivered",
      timestamp: new Date()
    });

    // EMAIL NOTIFICATION - DELIVERED
    try {
      if (!order.emailSent?.delivered) {
        const user = await User.findById(order.user_id);
        if (user) {
          await sendOrderDeliveredEmail(user.email, user.name, order.orderNumber);

          // Initialize if missing ensuring we don't overwrite if it exists but is partial
          // Mongoose handles partial updates fine usually but let's be safe
          if (!order.emailSent) {
            order.emailSent = {
              placed: true, // Legacy assumption
              confirmed: true,
              cancelled: false,
              outForDelivery: true,
              delivered: false
            };
          }

          order.emailSent.delivered = true;
        }
      }
    } catch (emailErr) {
      console.error("Failed to send Order Delivered email:", emailErr.message);
    }

    await order.save();
    res.json({ message: "Order delivered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to complete delivery", error: error.message });
  }
};
