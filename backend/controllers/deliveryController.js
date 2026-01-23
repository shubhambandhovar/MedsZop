const Order=require("../models/Order");

exports.acceptDelivery = async(req,res)=>{
 await Order.findByIdAndUpdate(req.params.id,{
   delivery_agent_id:req.user.id,
   order_status:"out_for_delivery"
 });
 res.json({message:"Delivery accepted"});
};

exports.completeDelivery = async(req,res)=>{
 await Order.findByIdAndUpdate(req.params.id,{
   order_status:"delivered"
 });
 res.json({message:"Delivered"});
};
