// const Razorpay = require("razorpay");
const Order = require("../models/Order");

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET
// });

// exports.createPaymentOrder = async (req,res)=>{
//   const order = await Order.findById(req.body.order_id);
//   const razorpayOrder = await razorpay.orders.create({
//     amount: order.total * 100,
//     currency:"INR",
//     receipt: order._id.toString()
//   });
//   res.json(razorpayOrder);
// };

exports.verifyPayment = async (req,res)=>{
 await Order.findByIdAndUpdate(req.body.order_id,{
   payment_status:"paid",
   order_status:"confirmed"
 });
 res.json({verified:true});
};
