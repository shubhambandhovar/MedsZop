const mongoose=require("mongoose");

module.exports=mongoose.model("Prescription", new mongoose.Schema({
 user_id:String,
 raw_text:String,
 parsed_data:Object,
 createdAt:{type:Date,default:Date.now}
}));
