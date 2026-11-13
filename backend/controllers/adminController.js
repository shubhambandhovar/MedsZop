const User = require("../models/User");
const Order = require("../models/Order");
const Pharmacy = require("../models/Pharmacy");
const Medicine = require("../models/Medicine");
const Prescription = require("../models/Prescription");
const Consultation = require("../models/Consultation");
const Payment = require("../models/Payment");
const Refund = require("../models/Refund");
const DoctorApplication = require("../models/DoctorApplication");
const PharmacistApplication = require("../models/PharmacistApplication");
const DeliveryApplication = require("../models/DeliveryApplication");
const AuditLog = require("../models/AuditLog");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { isProtectedAdminUser } = require("../utils/protectedAdmin");
const sessionManager = require("../utils/sessionManager");

/**
 * Internal Audit Logger Helper
 */
async function logAudit(req, action, target_type, target_id, details) {
  try {
    let email = (req.user && req.user.email) ? req.user.email : "admin@medszop.com";
    if (email === "admin@medszop.com" && req.user && req.user.id) {
      const u = await User.findById(req.user.id);
      if (u && u.email) email = u.email;
    }
    await AuditLog.create({
      admin_id: req.user ? req.user.id : null,
      admin_email: email,
      action,
      target_type,
      target_id: String(target_id || ""),
      details: details || {},
      ip_address: req.ip || (req.headers && req.headers["x-forwarded-for"]) || "127.0.0.1"
    });
  } catch (err) {
    // Non-blocking internal audit logger
  }
}

/**
 * =========================================================
 * 1. OVERVIEW & STATS
 * =========================================================
 */
exports.stats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCustomers,
      totalPharmacies,
      verifiedPharmacies,
      totalDoctors,
      totalDeliveryAgents,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      recentOrders,
      pendingDoctors,
      pendingPharmacists,
      pendingDelivery,
      pendingPrescriptions
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "customer" }),
      Pharmacy.countDocuments(),
      Pharmacy.countDocuments({ verified: true }),
      User.countDocuments({ role: "doctor" }),
      User.countDocuments({ role: "delivery" }),
      Order.countDocuments(),
      Order.countDocuments({ order_status: { $in: ["pending", "placed", "confirmed", "packed", "out_for_delivery"] } }),
      Order.countDocuments({ order_status: "delivered" }),
      Order.countDocuments({ order_status: "cancelled" }),
      Order.find().sort({ createdAt: -1 }).limit(10),
      DoctorApplication.countDocuments({ status: "PENDING" }),
      PharmacistApplication.countDocuments({ status: "PENDING" }),
      DeliveryApplication.countDocuments({ status: "PENDING" }),
      Prescription.countDocuments({ status: "uploaded" })
    ]);

    // Calculate Gross Revenue from delivered or paid orders
    const revenueAgg = await Order.aggregate([
      { $match: { order_status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);
    const gross_revenue = revenueAgg.length > 0 ? parseFloat(revenueAgg[0].total.toFixed(2)) : 0;

    res.json({
      users_count: totalUsers,
      customers_count: totalCustomers,
      pharmacies_count: totalPharmacies,
      verified_pharmacies_count: verifiedPharmacies,
      doctors_count: totalDoctors,
      delivery_count: totalDeliveryAgents,
      orders_count: totalOrders,
      pending_orders_count: pendingOrders,
      delivered_orders_count: deliveredOrders,
      cancelled_orders_count: cancelledOrders,
      total_revenue: gross_revenue,
      pending_applications: pendingDoctors + pendingPharmacists + pendingDelivery,
      pending_prescriptions: pendingPrescriptions,
      recent_orders: recentOrders
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ message: "Failed to load admin stats", error: err.message });
  }
};

/**
 * =========================================================
 * 2. ANALYTICS (Time-series & Distributions)
 * =========================================================
 */
exports.getAnalytics = async (req, res) => {
  try {
    const range = req.query.range || "7d";
    let days = 7;
    if (range === "30d") days = 30;
    if (range === "90d") days = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Order & Revenue Trend by day
    const trendAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          orders: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $ne: ["$order_status", "cancelled"] }, "$total", 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format full date map so zero-activity days are included cleanly
    const trendMap = new Map();
    trendAgg.forEach(item => trendMap.set(item._id, { orders: item.orders, revenue: Math.round(item.revenue) }));

    const revenue_trend = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const entry = trendMap.get(key) || { orders: 0, revenue: 0 };
      revenue_trend.push({
        date: key,
        displayDate: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        orders: entry.orders,
        revenue: entry.revenue
      });
    }

    // Status distribution
    const statusAgg = await Order.aggregate([
      { $group: { _id: "$order_status", count: { $sum: 1 } } }
    ]);
    const status_distribution = statusAgg.map(s => ({
      name: s._id || "pending",
      value: s.count
    }));

    // Payment methods
    const paymentAgg = await Order.aggregate([
      { $group: { _id: "$payment_method", count: { $sum: 1 } } }
    ]);
    const payment_distribution = paymentAgg.map(p => ({
      name: (p._id || "cod").toUpperCase(),
      value: p.count
    }));

    res.json({
      range,
      revenue_trend,
      status_distribution,
      payment_distribution
    });
  } catch (err) {
    console.error("Admin analytics error:", err);
    res.status(500).json({ message: "Failed to load analytics", error: err.message });
  }
};

/**
 * =========================================================
 * 3. ORDERS MANAGEMENT
 * =========================================================
 */
exports.getOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const { status, payment_status, search } = req.query;

    const filter = {};
    if (status && status !== "ALL") {
      filter.order_status = status;
    }
    if (payment_status && payment_status !== "ALL") {
      filter.payment_status = payment_status;
    }
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { orderNumber: { $regex: q, $options: "i" } },
        { "address.name": { $regex: q, $options: "i" } },
        { "address.city": { $regex: q, $options: "i" } },
        { "address.phone": { $regex: q, $options: "i" } }
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter)
    ]);

    res.json({
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error("Get admin orders error:", err);
    res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch order", error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status, reason } = req.body;

    const validStatuses = ["pending", "confirmed", "packed", "out_for_delivery", "delivered", "cancelled"];
    if (!validStatuses.includes(order_status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const previousStatus = order.order_status;
    order.order_status = order_status;

    if (!Array.isArray(order.status_history)) {
      order.status_history = [];
    }
    order.status_history.push({
      status: order_status,
      timestamp: new Date(),
      updatedBy: "Admin",
      note: reason || `Status changed from ${previousStatus} to ${order_status}`
    });

    if (order_status === "cancelled") {
      order.cancelledBy = "Admin";
      order.cancelledAt = new Date();
      order.cancelReason = reason || "Administrative cancellation";
    }

    await order.save();

    await logAudit(req, "UPDATE_ORDER_STATUS", "Order", id, {
      from: previousStatus,
      to: order_status,
      reason
    });

    res.json({ message: "Order status updated successfully", order });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ message: "Failed to update order status", error: err.message });
  }
};

/**
 * =========================================================
 * 4. MEDICINE CATALOG MANAGEMENT
 * =========================================================
 */
exports.getMedicines = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const { search, category, prescription } = req.query;

    const filter = {};
    if (category && category !== "ALL") {
      filter.category = category;
    }
    if (prescription === "true") {
      filter.requires_prescription = true;
    } else if (prescription === "false") {
      filter.requires_prescription = false;
    }
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { generic_name: { $regex: q, $options: "i" } },
        { brand: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } }
      ];
    }

    const [medicines, total, categories] = await Promise.all([
      Medicine.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      Medicine.countDocuments(filter),
      Medicine.distinct("category")
    ]);

    res.json({
      medicines,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      categories: categories.filter(Boolean)
    });
  } catch (err) {
    console.error("Get medicines error:", err);
    res.status(500).json({ message: "Failed to fetch medicines", error: err.message });
  }
};

exports.createMedicine = async (req, res) => {
  try {
    const { name, brand, generic_name, category, price, discount_price, stock, requires_prescription, dosage_form, strength, manufacturer, image_url } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ message: "Medicine name and price are required" });
    }

    const medicine = await Medicine.create({
      name,
      brand: brand || "",
      generic_name: generic_name || "",
      category: category || "General",
      price: parseFloat(price) || 0,
      discount_price: discount_price ? parseFloat(discount_price) : undefined,
      stock: parseInt(stock, 10) || 0,
      requires_prescription: Boolean(requires_prescription),
      dosage_form: dosage_form || "",
      strength: strength || "",
      manufacturer: manufacturer || "",
      image_url: image_url || ""
    });

    await logAudit(req, "CREATE_MEDICINE", "Medicine", medicine._id, { name, price, stock });

    res.status(201).json(medicine);
  } catch (err) {
    console.error("Create medicine error:", err);
    res.status(500).json({ message: "Failed to create medicine", error: err.message });
  }
};

exports.updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = await Medicine.findByIdAndUpdate(id, req.body, { new: true });
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    await logAudit(req, "UPDATE_MEDICINE", "Medicine", id, req.body);
    res.json(medicine);
  } catch (err) {
    console.error("Update medicine error:", err);
    res.status(500).json({ message: "Failed to update medicine", error: err.message });
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = await Medicine.findByIdAndDelete(id);
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    await logAudit(req, "DELETE_MEDICINE", "Medicine", id, { name: medicine.name });
    res.json({ message: "Medicine removed successfully" });
  } catch (err) {
    console.error("Delete medicine error:", err);
    res.status(500).json({ message: "Failed to delete medicine", error: err.message });
  }
};

/**
 * =========================================================
 * 5. USER MANAGEMENT (Customer, Doctor, Courier, Admin)
 * =========================================================
 */
exports.getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const { role, search } = req.query;

    const filter = {};
    if (role && role !== "ALL") {
      filter.role = role;
    }
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter)
    ]);

    const enrichedUsers = users.map((u) => {
      const obj = u.toObject ? u.toObject() : u;
      const isProtected = isProtectedAdminUser(obj);
      return {
        ...obj,
        isProtectedAdmin: isProtected,
        protectedAdminType: obj.protectedAdminType || (isProtected ? "founder" : null)
      };
    });

    res.json({
      users: enrichedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
};

/**
 * GET SINGLE USER DETAILS WITH LINKED COUNTS
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const obj = user.toObject ? user.toObject() : user;
    const isProtected = isProtectedAdminUser(obj);
    obj.isProtectedAdmin = isProtected;
    obj.protectedAdminType = obj.protectedAdminType || (isProtected ? "founder" : null);

    const userIdStr = String(user._id);
    const [ordersCount, prescriptionsCount, consultationsCount] = await Promise.all([
      Order.countDocuments({ user_id: userIdStr }),
      Prescription.countDocuments({ user_id: userIdStr }),
      Consultation.countDocuments({ $or: [{ patient_id: user._id }, { doctor_id: user._id }] })
    ]);

    res.json({
      user: obj,
      stats: {
        ordersCount,
        prescriptionsCount,
        consultationsCount
      }
    });
  } catch (err) {
    console.error("Get user details error:", err);
    res.status(500).json({ message: "Failed to fetch user details", error: err.message });
  }
};

/**
 * UPDATE USER STATUS (DEACTIVATE / REACTIVATE)
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, reason } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({ message: "isActive boolean is required" });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const requesterId = String(req.user?.id || req.user?._id || "");
    const targetId = String(targetUser._id);

    // SEC-06: Self-deactivation protection
    if (requesterId === targetId && isActive === false) {
      return res.status(403).json({ message: "You cannot deactivate your own administrator account." });
    }

    // SEC-07: Protection against deactivating the last active administrator
    if (targetUser.role === "admin" && isActive === false) {
      const activeAdmins = await User.countDocuments({
        role: "admin",
        isActive: { $ne: false },
        isDeleted: { $ne: true }
      });
      if (activeAdmins <= 1) {
        return res.status(403).json({
          message: "Cannot deactivate the last active administrator account. MedsZop requires at least one active administrator."
        });
      }
    }

    // PHASE 3: Permanent Super Admin Protection against deactivation
    if (isProtectedAdminUser(targetUser) && isActive === false) {
      await logAudit(
        req,
        "SECURITY_VIOLATION_PROTECTED_ADMIN_TAMPER",
        "User",
        targetUser._id,
        {
          attempt: "DEACTIVATE",
          blocked: true,
          email: targetUser.email,
          reason: "Primary Founder / Super Admin account is permanently protected against deactivation"
        }
      );
      return res.status(403).json({
        message: "Action blocked: The primary Founder / Super Admin account is permanently protected against deactivation.",
        code: "PROTECTED_ADMIN_IMMUTABLE"
      });
    }

    targetUser.isActive = Boolean(isActive);
    if (!isActive) {
      targetUser.deactivatedAt = new Date();
      targetUser.deactivatedBy = req.user?.email || "admin";
      targetUser.deactivationReason = reason || "Administrative deactivation";
      // Revoke all active sessions immediately upon deactivation
      await sessionManager.revokeUserSessions(targetUser._id, "ACCOUNT_DEACTIVATED");
    } else {
      targetUser.deactivatedAt = null;
      targetUser.deactivatedBy = null;
      targetUser.deactivationReason = "";
    }

    await targetUser.save();

    await logAudit(
      req,
      isActive ? "REACTIVATE_USER" : "DEACTIVATE_USER",
      "User",
      targetUser._id,
      {
        email: targetUser.email,
        role: targetUser.role,
        isActive: targetUser.isActive,
        reason: targetUser.deactivationReason
      }
    );

    res.json({
      message: `User account successfully ${isActive ? "reactivated" : "deactivated"}`,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        isActive: targetUser.isActive,
        deactivatedAt: targetUser.deactivatedAt
      }
    });
  } catch (err) {
    console.error("Update user status error:", err);
    res.status(500).json({ message: "Failed to update user status", error: err.message });
  }
};

/**
 * CHECK USER DELETION DEPENDENCIES
 */
exports.checkUserDeletionDependencies = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await User.findById(id).select("-password");
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // PHASE 3: Permanent Super Admin Protection
    if (isProtectedAdminUser(targetUser)) {
      return res.json({
        user: {
          _id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
          isProtectedAdmin: true,
          protectedAdminType: targetUser.protectedAdminType || "founder"
        },
        dependencies: {
          customerOrders: 0,
          courierOrders: 0,
          prescriptions: 0,
          patientConsultations: 0,
          doctorConsultations: 0,
          pharmacies: 0,
          partnerApplications: 0,
          auditLogs: 0,
          totalDependencies: 0
        },
        canHardDelete: false,
        canAnonymize: false,
        isProtectedAdmin: true,
        blockingReason: "Action blocked: The primary Founder / Super Admin account is permanently protected against deletion and anonymization."
      });
    }

    const userIdStr = String(targetUser._id);
    const userEmail = targetUser.email ? targetUser.email.toLowerCase() : "";

    const [
      customerOrders,
      courierOrders,
      prescriptions,
      patientConsultations,
      doctorConsultations,
      pharmacies,
      doctorApps,
      pharmacistApps,
      deliveryApps,
      auditLogs
    ] = await Promise.all([
      Order.countDocuments({ user_id: userIdStr }),
      Order.countDocuments({ delivery_agent_id: userIdStr }),
      Prescription.countDocuments({ user_id: userIdStr }),
      Consultation.countDocuments({ patient_id: targetUser._id }),
      Consultation.countDocuments({ doctor_id: targetUser._id }),
      Pharmacy.countDocuments({ email: userEmail }),
      DoctorApplication.countDocuments({ email: userEmail }),
      PharmacistApplication.countDocuments({ email: userEmail }),
      DeliveryApplication.countDocuments({ email: userEmail }),
      AuditLog.countDocuments({ $or: [{ admin_id: targetUser._id }, { admin_email: userEmail }] })
    ]);

    const totalMedicalRecords = customerOrders + courierOrders + prescriptions + patientConsultations + doctorConsultations;
    const totalPartnerRecords = pharmacies + doctorApps + pharmacistApps + deliveryApps;
    const totalDependencies = totalMedicalRecords + totalPartnerRecords + auditLogs;

    let canHardDelete = true;
    let canAnonymize = true;
    let blockingReason = null;

    if (totalMedicalRecords > 0) {
      canHardDelete = false;
      blockingReason = `Account has ${customerOrders} orders, ${prescriptions} prescriptions, and ${patientConsultations + doctorConsultations} consultations that must legally be retained under healthcare compliance standards. Permanent anonymization (scrubbing personal identifiable data) is available.`;
    } else if (totalPartnerRecords > 0) {
      canHardDelete = false;
      blockingReason = `Account has linked dispensary or partner credentials. Deactivation or anonymization is recommended.`;
    }

    res.json({
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role
      },
      dependencies: {
        customerOrders,
        courierOrders,
        prescriptions,
        patientConsultations,
        doctorConsultations,
        pharmacies,
        partnerApplications: doctorApps + pharmacistApps + deliveryApps,
        auditLogs,
        totalDependencies
      },
      canHardDelete,
      canAnonymize,
      blockingReason
    });
  } catch (err) {
    console.error("Check dependencies error:", err);
    res.status(500).json({ message: "Failed to inspect user dependencies", error: err.message });
  }
};

/**
 * PERMANENT USER DELETION OR ANONYMIZATION
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmation, reason, anonymize } = req.body;

    if (confirmation !== "DELETE") {
      return res.status(400).json({
        message: "Explicit confirmation required. Please type DELETE to confirm."
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const requesterId = String(req.user?.id || req.user?._id || "");
    const targetId = String(targetUser._id);

    // SEC-08: Admin Self-Deletion Protection
    if (requesterId === targetId) {
      return res.status(403).json({ message: "You cannot delete your own administrator account." });
    }

    // SEC-09: Last Active Admin Deletion Protection
    if (targetUser.role === "admin") {
      const activeAdmins = await User.countDocuments({
        role: "admin",
        isActive: { $ne: false },
        isDeleted: { $ne: true }
      });
      if (activeAdmins <= 1) {
        return res.status(403).json({
          message: "Cannot delete the last active administrator account. The platform requires at least one active administrator."
        });
      }
    }

    // PHASE 3: Permanent Super Admin Protection against deletion
    if (isProtectedAdminUser(targetUser)) {
      await logAudit(
        req,
        "SECURITY_VIOLATION_PROTECTED_ADMIN_TAMPER",
        "User",
        targetUser._id,
        {
          attempt: "DELETE",
          blocked: true,
          email: targetUser.email,
          reason: "Primary Founder / Super Admin account is permanently protected against deletion"
        }
      );
      return res.status(403).json({
        message: "Action blocked: The primary Founder / Super Admin account is permanently protected against deletion.",
        code: "PROTECTED_ADMIN_IMMUTABLE"
      });
    }

    // Dependency check
    const userIdStr = String(targetUser._id);
    const userEmail = targetUser.email ? targetUser.email.toLowerCase() : "";

    const [customerOrders, courierOrders, prescriptions, patientCons, doctorCons, pharmacies] = await Promise.all([
      Order.countDocuments({ user_id: userIdStr }),
      Order.countDocuments({ delivery_agent_id: userIdStr }),
      Prescription.countDocuments({ user_id: userIdStr }),
      Consultation.countDocuments({ patient_id: targetUser._id }),
      Consultation.countDocuments({ doctor_id: targetUser._id }),
      Pharmacy.countDocuments({ email: userEmail })
    ]);

    const totalMedicalRecords = customerOrders + courierOrders + prescriptions + patientCons + doctorCons;
    const totalPartnerRecords = pharmacies;

    // Block hard deletion if clinical/order records exist and anonymize is not selected
    if (totalMedicalRecords > 0 && !anonymize) {
      return res.status(400).json({
        message: `Deletion blocked: Account has ${totalMedicalRecords} linked clinical/order records that cannot legally be deleted. Please use Anonymization to scrub PII or deactivate the account.`,
        canAnonymize: true,
        dependencies: { customerOrders, prescriptions, consultations: patientCons + doctorCons }
      });
    }

    // Path A: Anonymization Deletion (Required when linked legal records exist, or requested)
    if (anonymize || totalMedicalRecords > 0 || totalPartnerRecords > 0) {
      const originalEmail = targetUser.email;
      const originalRole = targetUser.role;

      targetUser.name = "Deleted User";
      targetUser.email = `anonymized_${targetUser._id}@deleted.medszop.com`;
      targetUser.phone = "";
      targetUser.addresses = [];
      targetUser.cart = [];
      targetUser.password = undefined;
      targetUser.googleId = null;
      targetUser.isActive = false;
      targetUser.isDeleted = true;
      targetUser.deletedAt = new Date();
      targetUser.deletedBy = req.user?.email || "admin";
      targetUser.deletionReason = reason || "GDPR/DPDPA Data Anonymization";

      await targetUser.save();

      // Revoke all active sessions immediately upon account anonymization
      await sessionManager.revokeUserSessions(targetUser._id, "ACCOUNT_ANONYMIZED");

      await logAudit(req, "ANONYMIZE_USER", "User", targetUser._id, {
        originalEmail,
        originalRole,
        reason: targetUser.deletionReason,
        retainedOrders: customerOrders,
        retainedPrescriptions: prescriptions
      });

      return res.json({
        message: "Account personal data successfully scrubbed and anonymized. Legal clinical records preserved.",
        mode: "anonymized",
        user: { _id: targetUser._id, isDeleted: true, isActive: false }
      });
    }

    // Path B: Hard Deletion (Permitted ONLY when zero linked records exist)
    await User.findByIdAndDelete(id);

    // Revoke all active sessions
    await sessionManager.revokeUserSessions(id, "ACCOUNT_HARD_DELETED");

    await logAudit(req, "HARD_DELETE_USER", "User", id, {
      email: targetUser.email,
      role: targetUser.role,
      reason: reason || "Permanent clean deletion"
    });

    res.json({
      message: "User account permanently removed from database.",
      mode: "hard_deleted"
    });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Failed to delete user", error: err.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ["customer", "pharmacy", "delivery", "doctor", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // Safety: Admin cannot demote themselves accidentally
    if (req.user && req.user.id === id && role !== "admin") {
      return res.status(403).json({ message: "You cannot demote your own administrator account." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // PHASE 3: Permanent Super Admin Protection against demotion or role tampering
    if (isProtectedAdminUser(user) && role !== "admin") {
      await logAudit(
        req,
        "SECURITY_VIOLATION_PROTECTED_ADMIN_TAMPER",
        "User",
        user._id,
        {
          attempt: "DEMOTE",
          blocked: true,
          requestedRole: role,
          email: user.email,
          reason: "Primary Founder / Super Admin role cannot be demoted or changed"
        }
      );
      return res.status(403).json({
        message: "Action blocked: The primary Founder / Super Admin account role cannot be demoted or changed.",
        code: "PROTECTED_ADMIN_IMMUTABLE"
      });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await logAudit(req, "UPDATE_USER_ROLE", "User", id, { from: oldRole, to: role, email: user.email });

    res.json({ message: `User role updated to ${role}`, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Update user role error:", err);
    res.status(500).json({ message: "Failed to update user role", error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (!["pharmacy", "delivery", "doctor", "admin", "customer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Strip protection flags from manual creation
    delete req.body.isProtectedAdmin;
    delete req.body.protectedAdminType;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      phone: phone || ""
    });

    await logAudit(req, "CREATE_USER", "User", user._id, { email: user.email, role: user.role });

    user.password = undefined;
    res.status(201).json(user);
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ message: "Failed to create user", error: err.message });
  }
};

/**
 * =========================================================
 * 6. PHARMACIES
 * =========================================================
 */
exports.getPharmacies = async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find().sort({ createdAt: -1 });
    res.json(pharmacies);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pharmacies", error: err.message });
  }
};

exports.verifyPharmacy = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }

    pharmacy.verified = req.body.verified !== undefined ? Boolean(req.body.verified) : true;
    await pharmacy.save();

    await logAudit(req, pharmacy.verified ? "VERIFY_PHARMACY" : "UNVERIFY_PHARMACY", "Pharmacy", pharmacy._id, {
      name: pharmacy.name,
      verified: pharmacy.verified
    });

    res.json({ message: `Pharmacy ${pharmacy.verified ? "verified" : "unverified"} successfully`, pharmacy });
  } catch (err) {
    res.status(500).json({ message: "Failed to update pharmacy verification", error: err.message });
  }
};

/**
 * =========================================================
 * 7. HEALTHCARE & PRESCRIPTIONS
 * =========================================================
 */
exports.getPrescriptions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const filter = {};
    if (status && status !== "ALL") {
      filter.status = status;
    }

    const [prescriptions, total] = await Promise.all([
      Prescription.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Prescription.countDocuments(filter)
    ]);

    res.json({
      prescriptions,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch prescriptions", error: err.message });
  }
};

exports.updatePrescriptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!["uploaded", "verified", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid prescription status" });
    }

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    prescription.status = status;
    await prescription.save();

    await logAudit(req, "REVIEW_PRESCRIPTION", "Prescription", id, { status, reason });

    res.json({ message: `Prescription marked as ${status}`, prescription });
  } catch (err) {
    res.status(500).json({ message: "Failed to update prescription status", error: err.message });
  }
};

exports.getConsultations = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const filter = {};
    if (status && status !== "ALL") {
      filter.status = status;
    }

    const [consultations, total] = await Promise.all([
      Consultation.find(filter)
        .populate("patient_id", "name email phone")
        .populate("doctor_id", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Consultation.countDocuments(filter)
    ]);

    res.json({
      consultations,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch consultations", error: err.message });
  }
};

/**
 * =========================================================
 * 8. OPERATIONS: DELIVERIES & PARTNER APPLICATIONS
 * =========================================================
 */
exports.getDeliveries = async (req, res) => {
  try {
    const [agents, activeOrders] = await Promise.all([
      User.find({ role: "delivery" }).select("-password").sort({ createdAt: -1 }),
      Order.find({ order_status: { $in: ["confirmed", "packed", "out_for_delivery"] } }).sort({ createdAt: -1 })
    ]);

    res.json({
      agents,
      activeOrders
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch deliveries", error: err.message });
  }
};

exports.getPartnerApplications = async (req, res) => {
  try {
    const { type, status } = req.query;
    const query = {};
    if (status && status !== "ALL") {
      query.status = status;
    }

    let doctors = [];
    let pharmacists = [];
    let delivery = [];

    if (!type || type === "ALL" || type === "doctor") {
      doctors = await DoctorApplication.find(query).sort({ createdAt: -1 });
    }
    if (!type || type === "ALL" || type === "pharmacist") {
      pharmacists = await PharmacistApplication.find(query).sort({ createdAt: -1 });
    }
    if (!type || type === "ALL" || type === "delivery") {
      delivery = await DeliveryApplication.find(query).sort({ createdAt: -1 });
    }

    // Normalized application items
    const normalized = [
      ...doctors.map(d => ({
        _id: d._id,
        type: "doctor",
        name: d.name,
        email: d.email,
        phone: d.phone,
        specialization: d.specialization,
        registration_number: d.registration_number,
        status: d.status,
        createdAt: d.createdAt,
        remarks: d.admin_remarks || d.rejection_reason || ""
      })),
      ...pharmacists.map(p => ({
        _id: p._id,
        type: "pharmacist",
        name: p.owner_name || p.pharmacy_name,
        email: p.email,
        phone: p.phone,
        pharmacy_name: p.pharmacy_name,
        license_number: p.license_number,
        status: p.status,
        createdAt: p.createdAt,
        remarks: p.admin_remarks || p.rejection_reason || ""
      })),
      ...delivery.map(c => ({
        _id: c._id,
        type: "delivery",
        name: c.name,
        email: c.email,
        phone: c.phone,
        vehicle_type: c.vehicle_type,
        driving_license: c.driving_license,
        status: c.status,
        createdAt: c.createdAt,
        remarks: c.admin_remarks || c.rejection_reason || ""
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const counts = {
      pending: normalized.filter(a => a.status === "PENDING").length,
      approved: normalized.filter(a => a.status === "APPROVED").length,
      rejected: normalized.filter(a => a.status === "REJECTED").length,
      total: normalized.length
    };

    res.json({
      applications: normalized,
      counts
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch partner applications", error: err.message });
  }
};

exports.reviewPartnerApplication = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { action, remarks } = req.body; // action: "APPROVE" | "REJECT"

    let Model;
    if (type === "doctor") Model = DoctorApplication;
    else if (type === "pharmacist") Model = PharmacistApplication;
    else if (type === "delivery") Model = DeliveryApplication;
    else return res.status(400).json({ message: "Invalid application type" });

    const app = await Model.findById(id);
    if (!app) return res.status(404).json({ message: "Application not found" });

    if (action === "REJECT") {
      app.status = "REJECTED";
      app.admin_remarks = remarks || "Application rejected by MedsZop administrator";
      app.rejection_reason = remarks || "Application rejected by MedsZop administrator";
      await app.save();

      await logAudit(req, `REJECT_${type.toUpperCase()}_APPLICATION`, Model.modelName, id, { remarks });
      return res.json({ message: "Application rejected successfully" });
    }

    if (action === "APPROVE") {
      app.status = "APPROVED";
      app.admin_remarks = remarks || "Approved";
      await app.save();

      // Ensure corresponding user account exists or update role
      let user = await User.findOne({ email: app.email });
      const targetRole = type === "pharmacist" ? "pharmacy" : type;

      if (!user) {
        // Create user with a secure random initial password
        const initialPass = Math.random().toString(36).slice(-8) + "Aa1@";
        const hashedPassword = await bcrypt.hash(initialPass, 10);
        user = await User.create({
          name: app.name || app.owner_name,
          email: app.email,
          phone: app.phone || "",
          role: targetRole,
          password: hashedPassword
        });
      } else {
        user.role = targetRole;
        await user.save();
      }

      // If pharmacy, register in Pharmacy collection if not present
      if (type === "pharmacist") {
        const existingPharma = await Pharmacy.findOne({ email: app.email });
        if (!existingPharma) {
          await Pharmacy.create({
            name: app.pharmacy_name,
            email: app.email,
            phone: app.phone || "",
            address: app.address || "",
            verified: true
          });
        }
      }

      await logAudit(req, `APPROVE_${type.toUpperCase()}_APPLICATION`, Model.modelName, id, {
        userId: user._id,
        role: targetRole
      });

      return res.json({ message: `Application approved and user role set to ${targetRole}` });
    }

    res.status(400).json({ message: "Action must be either APPROVE or REJECT" });
  } catch (err) {
    console.error("Review application error:", err);
    res.status(500).json({ message: "Failed to review application", error: err.message });
  }
};

/**
 * =========================================================
 * 9. BUSINESS: PAYMENTS & REFUNDS
 * =========================================================
 */
exports.getPayments = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const { status, search } = req.query;

    const filter = {};
    if (status && status !== "ALL") {
      filter.status = status;
    }
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { pg_payment_id: { $regex: q, $options: "i" } },
        { pg_order_id: { $regex: q, $options: "i" } }
      ];
    }

    const [payments, total, totalVolumeAgg] = await Promise.all([
      Payment.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit),
      Payment.countDocuments(filter),
      Payment.aggregate([
        { $match: { status: "SUCCESS" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    ]);

    const totalVolume = totalVolumeAgg.length > 0 ? totalVolumeAgg[0].total : 0;

    res.json({
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      totalVolume
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch payments", error: err.message });
  }
};

exports.getRefunds = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [refunds, total] = await Promise.all([
      Refund.find().sort({ created_at: -1 }).skip(skip).limit(limit),
      Refund.countDocuments()
    ]);

    res.json({
      refunds,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch refunds", error: err.message });
  }
};

/**
 * =========================================================
 * 10. SYSTEM & AUDIT LOGS
 * =========================================================
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;
    const { action, search } = req.query;

    const filter = {};
    if (action && action !== "ALL") {
      filter.action = action;
    }
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { admin_email: { $regex: q, $options: "i" } },
        { action: { $regex: q, $options: "i" } },
        { target_type: { $regex: q, $options: "i" } }
      ];
    }

    const [logs, total, actions] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(filter),
      AuditLog.distinct("action")
    ]);

    res.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      actions: actions.filter(Boolean)
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch audit logs", error: err.message });
  }
};

exports.getSystemHealth = async (req, res) => {
  try {
    const mongoState = ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState] || "unknown";
    const memUsage = process.memoryUsage();

    res.json({
      status: "operational",
      uptime: process.uptime(),
      timestamp: new Date(),
      node_version: process.version,
      platform: process.platform,
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`
      },
      database: {
        status: mongoState,
        name: mongoose.connection.name || "test"
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve health status", error: err.message });
  }
};

/**
 * RECONCILE COD PAYMENT
 * Dedicated Admin endpoint to separate delivery OTP handover from accounting reconciliation
 */
exports.reconcileCodPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.payment_method !== "cod") {
      return res.status(400).json({ message: "Only Cash on Delivery orders require cash reconciliation." });
    }

    if (!order.handover_verified || order.order_status !== "delivered") {
      return res.status(400).json({ message: "Cannot reconcile COD before order handover is verified and delivered." });
    }

    if (order.cod_reconciled) {
      return res.status(400).json({ message: "Order COD payment is already reconciled." });
    }

    order.cod_reconciled = true;
    order.cod_reconciled_at = new Date();
    order.cod_reconciled_by = req.user.id;
    await order.save();

    if (AuditLog) {
      try {
        await AuditLog.create({
          user: req.user.id,
          action: "COD_PAYMENT_RECONCILED",
          details: { orderId: order._id, amount: order.cod_collected_amount || order.total }
        });
      } catch (e) {
        console.warn("AuditLog warning:", e.message);
      }
    }

    res.json({
      message: "COD payment successfully reconciled with accounts ledger.",
      order: {
        _id: order._id,
        cod_collected: order.cod_collected,
        cod_collected_amount: order.cod_collected_amount,
        cod_reconciled: order.cod_reconciled,
        cod_reconciled_at: order.cod_reconciled_at
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to reconcile COD payment", error: err.message });
  }
};
