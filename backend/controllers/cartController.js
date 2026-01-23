const User = require("../models/User");

exports.getCart = async (req,res)=>{
 const user = await User.findById(req.user.id);
 res.json(user.cart);
};

exports.addToCart = async (req,res)=>{
 const user = await User.findById(req.user.id);

 const item = req.body;
 const existing = user.cart.find(i=>i.medicine_id===item.medicine_id);

 if(existing){
   existing.quantity += item.quantity;
 } else {
   user.cart.push(item);
 }

 await user.save();
 res.json({message:"Added to cart"});
};

exports.clearCart = async (req,res)=>{
 const user = await User.findById(req.user.id);
 user.cart=[];
 await user.save();
 res.json({message:"Cart cleared"});
};
