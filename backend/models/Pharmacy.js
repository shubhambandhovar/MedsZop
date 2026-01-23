const mongoose=require("mongoose");

module.exports=mongoose.model("Pharmacy", new mongoose.Schema({
 user_id:String,
 name:String,
 license_number:String,
 address:String,
 verified:Boolean,
 createdAt:{type:Date,default:Date.now}
}));
