const User=require("../models/User");
const Order=require("../models/Order");

exports.stats = async(req,res)=>{
 const users = await User.countDocuments();
 const orders = await Order.countDocuments();

 res.json({users,orders});
};
