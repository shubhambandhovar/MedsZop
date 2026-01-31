const Pharmacy=require("../models/Pharmacy");
const Order = require("../models/Order");
exports.registerPharmacy = async(req,res)=>{
 const pharmacy = await Pharmacy.create({
   ...req.body,
   user_id:req.user.id,
   verified:false
 });

 res.json(pharmacy);
};

exports.getDashboard = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findOne({ user_id: req.user.id });

    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }

    const orders = await Order.find({ pharmacy_id: pharmacy._id });

    const stats = {
      medicines_count: pharmacy.medicines?.length || 0,
      total_orders: orders.length,
      pending_orders: orders.filter(o => o.order_status === "pending").length,
      total_revenue: orders.reduce((sum, o) => sum + o.total, 0)
    };

    res.json({ stats });

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
    const orders = await Order.find({ pharmacy_id: pharmacy._id });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};