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

exports.getDashboard = async(req,res)=>{
 const pharmacy = await Pharmacy.findOne({user_id:req.user.id});
 res.json(pharmacy);
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