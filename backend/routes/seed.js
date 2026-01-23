const Medicine=require("../models/Medicine");

router.post("/", async(req,res)=>{
 await Medicine.insertMany(require("../data/sampleMedicines.json"));
 res.json({message:"Seeded"});
});
