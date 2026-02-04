const Pharmacy = require("../models/Pharmacy");
const Order = require("../models/Order");
exports.registerPharmacy = async (req, res) => {
  const pharmacy = await Pharmacy.create({
    ...req.body,
    user_id: req.user.id,
    verified: false
  });

  res.json(pharmacy);
};

exports.getDashboard = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findOne({ user_id: req.user.id });

    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }

    // 1. Get truly assigned orders for revenue/stats
    const pharmacyIdStr = pharmacy._id.toString();
    const assignedOrders = await Order.find({ pharmacy_id: pharmacyIdStr });

    // 2. Get pool orders (Global orders that are not yet assigned)
    const poolOrders = await Order.find({ pharmacy_id: null, order_status: "pending" });

    const stats = {
      medicines_count: pharmacy.medicines?.length || 0,
      total_orders: assignedOrders.length,
      pending_orders: assignedOrders.filter(o => o.order_status === "pending").length + poolOrders.length,
      total_revenue: assignedOrders.reduce((sum, o) => sum + o.total, 0)
    };

    res.json({ stats, medicines: pharmacy.medicines });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPharmacyOrders = async (req, res) => {
  try {
    // Find the pharmacy for the logged-in user
    const pharmacy = await Pharmacy.findOne({ user_id: req.user.id });
    if (!pharmacy) {
      return res.status(404).json({ error: "Pharmacy not found" });
    }
    // Find orders for this pharmacy
    // Find orders for this pharmacy OR unassigned pool orders
    const orders = await Order.find({
      $or: [
        { pharmacy_id: pharmacy._id.toString() },
        { pharmacy_id: null, order_status: "pending" }
      ]
    }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.addMedicine = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findOne({ user_id: req.user.id });

    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }

    const {
      name,
      price,
      genericName,
      company,
      mrp,
      description,
      image
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price required" });
    }

    // Auto-calculate discount if not provided
    let discount = 0;
    if (mrp && price < mrp) {
      discount = Math.round(((mrp - price) / mrp) * 100);
    }

    pharmacy.medicines.push({
      name,
      price,
      genericName,
      company,
      mrp,
      discount,
      description,
      image
    });
    await pharmacy.save();

    res.json({ message: "Medicine added successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
