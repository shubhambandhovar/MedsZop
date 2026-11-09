const Order = require("../models/Order");
const User = require("../models/User");
const { sendOrderDeliveredEmail } = require("../utils/emailService");

exports.getOrders = async (req, res) => {
  try {
    // SEC-03 Remediation: Strictly omit delivery_otp from delivery agent order queries
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
    })
      .select("-delivery_otp")
      .sort({ createdAt: -1 })
      .lean();

    // Manual populate for pharmacy details
    const Pharmacy = require("../models/Pharmacy");
    const pharmacyIds = orders.map(o => o.pharmacy_id).filter(id => id);
    const pharmacies = await Pharmacy.find({ _id: { $in: pharmacyIds } });
    const pharmacyMap = {};
    pharmacies.forEach(p => pharmacyMap[p._id.toString()] = p);

    const ordersWithPharmacy = orders.map(o => {
      const sanitized = { ...o, pharmacy: pharmacyMap[o.pharmacy_id] || null };
      delete sanitized.delivery_otp; // Extra defense-in-depth safety
      return sanitized;
    });

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

    const orderResponse = order.toObject();
    delete orderResponse.delivery_otp; // SEC-03 Redaction

    res.json({ message: "Delivery accepted", order: orderResponse });
  } catch (error) {
    res.status(500).json({ message: "Failed to accept delivery", error: error.message });
  }
};

exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Enforce that only the assigned delivery agent (or admin) can update delivery status
    if (order.delivery_agent_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: You are not assigned to this delivery." });
    }

    order.order_status = status;
    order.status_history.push({
      status: status,
      timestamp: new Date()
    });

    await order.save();

    const orderResponse = order.toObject();
    delete orderResponse.delivery_otp; // SEC-03 Redaction

    res.json({ message: "Status updated", order: orderResponse });
  } catch (error) {
    res.status(500).json({ message: "Failed to update status", error: error.message });
  }
};

exports.completeDelivery = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // 1. Strict Assignment Check: Agent must be assigned to this order
    if (order.delivery_agent_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: You are not assigned to deliver this order." });
    }

    // 2. Prevent invalid state transitions
    if (order.order_status === "delivered") {
      return res.status(400).json({ message: "Order has already been marked as delivered." });
    }
    if (order.order_status === "cancelled") {
      return res.status(400).json({ message: "Cannot complete delivery for a cancelled order." });
    }

    // 3. SEC-03 Mandatory OTP Verification: delivery_otp MUST be present and match
    if (!order.delivery_otp) {
      return res.status(400).json({ message: "Order has no active delivery verification OTP. Please contact dispatch." });
    }

    const submittedOtp = req.body.otp ? req.body.otp.toString().trim() : "";
    if (!submittedOtp || submittedOtp !== order.delivery_otp.toString().trim()) {
      return res.status(400).json({ message: "Invalid OTP. Delivery verification failed." });
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

          if (!order.emailSent) {
            order.emailSent = {
              placed: true,
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
