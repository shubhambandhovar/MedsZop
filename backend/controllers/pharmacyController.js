const Pharmacy=require("../models/Pharmacy");

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
