const Order = require("../models/Order");
const User = require("../models/User");
const Medicine = require("../models/Medicine");
const Pharmacy = require("../models/Pharmacy");
const mongoose = require("mongoose");
const {
  sendOrderPlacedEmail,
  sendOrderConfirmedEmail,
  sendOrderCancelledEmail,
  sendOrderDeliveredEmail,
  sendPharmacyOrderNotification,
  sendDeliveryRequestNotification
} = require("../utils/emailService");

// CREATE ORDER
exports.createOrder = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      console.error(`❌ User not found for ID: ${req.user.id}`);
      return res.status(401).json({ message: "User not found. Please log in again." });
    }

    if (!user.cart || !user.cart.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const { address_id, payment_method, prescription_url } = req.body;

    // Find the actual address object from user's addresses
    const address = user.addresses.find(
      (addr) => addr._id && addr._id.toString() === address_id
    );

    if (!address) {
      console.error(`❌ Address ID ${address_id} not found for user ${user._id}`);
      return res.status(400).json({ message: "Invalid delivery address. Please re-select your address." });
    }

    console.log(`📦 Creating order with ${user.cart.length} items...`);

    let items = [];
    let total = 0;
    let pharmacyId = null;
    let orderRequiresPrescription = false;

    for (let cartItem of user.cart) {
      if (!cartItem.medicine_id || cartItem.medicine_id === "undefined") {
        console.warn("⚠️ Skipping invalid cart item:", cartItem);
        continue;
      }
      // 1. Try Global Medicine
      let medicine = null;
      if (mongoose.Types.ObjectId.isValid(cartItem.medicine_id)) {
        medicine = await Medicine.findById(cartItem.medicine_id).lean();
      }

      // 2. Try Pharmacy Medicine
      if (!medicine) {
        try {
          const pharmacy = await Pharmacy.findOne(
            { "medicines._id": cartItem.medicine_id },
            { "medicines.$": 1, name: 1 }
          );
          if (pharmacy && pharmacy.medicines && pharmacy.medicines.length > 0) {
            const m = pharmacy.medicines[0];
            medicine = {
              _id: m._id,
              name: m.name,
              price: m.price || 0,
              discount_price: (m.mrp && m.mrp > m.price) ? m.price : null,
              pharmacy_id: pharmacy._id,
              requires_prescription: m.requiresPrescription
            };
          }
        } catch (e) {
          console.error(`Error looking up pharmacy medicine ${cartItem.medicine_id}:`, e.message);
        }
      }

      if (!medicine) {
        console.error(`❌ Medicine with ID ${cartItem.medicine_id} not found in global or pharmacy stocks.`);
        return res.status(400).json({ message: `Medicine not found: ${cartItem.medicine_id}. Please clear your cart and try again.` });
      }

      const price = Number(medicine.discount_price || medicine.price || 0);

      if (isNaN(price)) {
        console.error(`❌ Invalid price for medicine ${medicine.name}: ${price}`);
        return res.status(400).json({ message: `Invalid price for ${medicine.name}` });
      }

      // Set the pharmacy_id for the whole order if not set
      if (!pharmacyId && medicine.pharmacy_id) {
        pharmacyId = medicine.pharmacy_id.toString();
      }

      items.push({
        medicine_id: medicine._id.toString(),
        name: medicine.name,
        price,
        quantity: cartItem.quantity
      });

      // Check if this specific item requires prescription
      // Normalize check for both Global (snake_case) and Pharmacy (camelCase or custom obj)
      if (medicine.requires_prescription || medicine.requiresPrescription) {
        orderRequiresPrescription = true;
      }

      total += price * cartItem.quantity;
    }

    // CHECK PRESCRIPTION REQUIREMENT
    let finalStatus = payment_method === "online" ? "payment_pending" : "pending";
    if (orderRequiresPrescription) {
      if (!prescription_url) {
        return res.status(400).json({
          message: "Prescription is required for this order. Please upload a valid prescription."
        });
      }
      // If prescription exists, set status to verification
      finalStatus = "pending_verification";
    }

    const order = await Order.create({
      user_id: user._id,
      pharmacy_id: pharmacyId,
      items,
      total,
      address,
      payment_method: payment_method || "cod",
      prescription_url: prescription_url || null,
      requires_prescription: orderRequiresPrescription,
      order_status: finalStatus,
      payment_status: payment_method === "online" ? "pending" : "pending", // COD is pending until delivered
      status_history: [{ status: finalStatus, timestamp: new Date() }],
      orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    });

    // EMAIL NOTIFICATION - PLACED
    try {
      if (!order.emailSent?.placed) {
        // 1. Customer Email
        await sendOrderPlacedEmail(user.email, user.name, order.orderNumber);

        order.emailSent = order.emailSent || {};
        order.emailSent.placed = true;

        // 2. Pharmacy Email (New Feature)
        if (order.pharmacy_id && !order.emailSent.pharmacyNotified) {
          const pharmacy = await Pharmacy.findById(order.pharmacy_id);
          if (pharmacy) {
            const pharmacyUser = await User.findById(pharmacy.user_id);
            if (pharmacyUser && pharmacyUser.email) {
              await sendPharmacyOrderNotification(pharmacyUser.email, pharmacy.name || pharmacyUser.name, order.orderNumber);
              order.emailSent.pharmacyNotified = true;
              console.log(`[Email] Pharmacy notification sent to ${pharmacyUser.email}`);
            } else {
              console.warn(`[Email] Pharmacy user/email not found for pharmacy ${pharmacy._id}`);
            }
          }
        }

        await order.save();
      }
    } catch (emailErr) {
      console.error("Failed to send Order emails:", emailErr.message);
    }

    // Clear cart
    user.cart = [];
    await user.save();

    res.status(201).json({
      message: "Order placed successfully",
      order_id: order._id,
      order
    });

  } catch (err) {
    console.error("Create Order Fatal Error:", err);
    res.status(500).json({
      message: "Order placement failed on server",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  }
};


// GET USER ORDERS
exports.getOrders = async (req, res) => {

  try {

    const orders = await Order.find({ user_id: req.user.id })
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// GET SINGLE ORDER
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Ensure user can only see their own order
    if (order.user_id !== req.user.id && req.user.role === "customer") {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE ORDER STATUS (Admin / Pharmacy / Delivery)
exports.updateOrderStatus = async (req, res) => {

  try {

    const order = await Order.findById(req.params.id);

    if (!order)
      return res.status(404).json({ message: "Order not found" });

    order.order_status = req.body.status;

    // 🔥 AUTO-ASSIGN PHARMACY: If a pharmacy confirms an unassigned order, claim it
    if (req.user.role === "pharmacy" && req.body.status === "confirmed") {
      const pharmacy = await Pharmacy.findOne({ user_id: req.user.id });
      if (pharmacy && (!order.pharmacy_id || order.pharmacy_id === "")) {
        order.pharmacy_id = pharmacy._id.toString();
      }
    }

    // Ensure OTP is generated when order is confirmed/processing
    if (["confirmed", "processing", "out_for_delivery"].includes(req.body.status) && !order.delivery_otp) {
      order.delivery_otp = Math.floor(1000 + Math.random() * 9000).toString();
    }

    // Set payment to paid if order delivered via COD
    if (req.body.status === "delivered" && order.payment_method === "cod" && order.payment_status === "pending") {
      order.payment_status = "paid";
    }

    order.status_history.push({
      status: req.body.status,
      timestamp: new Date()
    });

    // EMAIL NOTIFICATIONS
    try {
      const user = await User.findById(order.user_id);
      if (user) {
        const status = req.body.status;

        // Initialize emailSent if missing (for old orders)
        if (!order.emailSent) {
          order.emailSent = {
            placed: true, // Assume placed email sent or skipped for old orders
            confirmed: false,
            cancelled: false,
            outForDelivery: false,
            delivered: false
          };
        }

        // CONFIRMED
        if (status === "confirmed" && !order.emailSent.confirmed) {
          await sendOrderConfirmedEmail(user.email, user.name, order.orderNumber);
          order.emailSent.confirmed = true;
        }

        // CANCELLED
        if (status === "cancelled" && !order.emailSent.cancelled) {
          await sendOrderCancelledEmail(user.email, user.name, order.orderNumber);
          order.emailSent.cancelled = true;
        }

        // DELIVERED
        if (status === "delivered" && !order.emailSent.delivered) {
          await sendOrderDeliveredEmail(user.email, user.name, order.orderNumber);
          order.emailSent.delivered = true;
        }
      }

      // DELIVERY PARTNER NOTIFICATION (New Feature)
      // Trigger: Status = confirmed AND not yet notified
      if (req.body.status === "confirmed" && !order.emailSent.deliveryNotified) {
        // Find ALL delivery partners (Broadcast model as per request constraint to not refactor logic)
        const deliveryPartners = await User.find({ role: "delivery" });

        if (deliveryPartners.length > 0) {
          console.log(`[Email] Broadcasting delivery request to ${deliveryPartners.length} partners...`);

          // Prepare location info
          let pickupLoc = "Pharmacy";
          if (order.pharmacy_id) {
            const ph = await Pharmacy.findById(order.pharmacy_id);
            if (ph) pickupLoc = `${ph.name} (${ph.address || 'No Address'})`;
          }

          const dropoffLoc = order.address ?
            `${order.address.addressLine1}, ${order.address.city}` : "Customer Location";

          // Send to all efficiently
          const emailPromises = deliveryPartners.map(dp =>
            sendDeliveryRequestNotification(dp.email, dp.name, order.orderNumber, pickupLoc, dropoffLoc)
              .catch(e => console.error(`Failed to send to partner ${dp.email}:`, e.message))
          );

          await Promise.allSettled(emailPromises);

          order.emailSent.deliveryNotified = true;
        } else {
          console.warn("[Email] No delivery partners found to notify.");
        }
      }

    } catch (emailErr) {
      console.error(`Failed to send email for order status ${req.body.status}:`, emailErr.message);
    }

    await order.save();

    res.json({ message: "Status updated" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CANCEL ORDER (Customer)
exports.cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    // Find and lock the order logic (findOneAndUpdate for atomicity)
    // Front-end statuses mapped: pending, pending_verification, confirmed
    const validStatuses = ["pending", "pending_verification", "confirmed", "cod_confirmed", "payment_pending"];

    // Attempt Atomic update
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        user_id: userId,
        order_status: { $in: validStatuses }
      },
      {
        $set: {
          order_status: "cancelled",
          cancelledBy: userId,
          cancelledAt: new Date(),
          cancelReason: req.body.reason || "No reason provided",
        },
        $push: {
          status_history: {
            status: "cancelled",
            timestamp: new Date()
          }
        }
      },
      { new: true } // return updated document
    );

    if (!order) {
      // Catching invalid status / ownership race conditions
      const existingOrder = await Order.findById(orderId);
      if (!existingOrder) return res.status(404).json({ message: "Order not found" });
      if (existingOrder.user_id !== userId) return res.status(403).json({ message: "Access denied" });
      if (existingOrder.order_status === "cancelled") return res.status(200).json({ message: "Order is already cancelled", order: existingOrder });

      return res.status(409).json({ message: "Order cannot be cancelled at this stage." });
    }

    res.json({ message: "Order cancelled successfully.", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// REQUEST RETURN (Customer)
exports.requestReturn = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    const { reason, comments, images } = req.body;

    // Check order
    const order = await Order.findOne({ _id: orderId, user_id: userId });

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.order_status !== "delivered") return res.status(400).json({ message: "Only delivered orders can be returned." });

    // Calculate time difference (48 hours return window)
    let deliveredEvent = order.status_history.find(h => h.status === "delivered");
    let deliveredAt = deliveredEvent ? new Date(deliveredEvent.timestamp) : new Date(); // fallback

    const windowMs = 48 * 60 * 60 * 1000;
    if (Date.now() - deliveredAt.getTime() > windowMs) {
      return res.status(400).json({ message: "Return window has expired." });
    }

    // Atomic update
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId, user_id: userId, order_status: "delivered" },
      {
        $set: {
          order_status: "return_requested",
          returnReason: reason,
          returnComments: comments,
          returnImages: images || [],
          returnRequestedAt: new Date(),
        },
        $push: {
          status_history: {
            status: "return_requested",
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(409).json({ message: "Could not process return request. Order status may have changed." });
    }

    res.json({ message: "Return requested successfully", order: updatedOrder });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
