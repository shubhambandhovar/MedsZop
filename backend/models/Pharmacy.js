const mongoose = require("mongoose");

const MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  genericName: String,
  company: String,
  mrp: Number,
  price: { type: Number, required: true },
  discount: Number,
  description: String,
  image: String,
  inStock: { type: Boolean, default: true }
});

module.exports = mongoose.model(
  "Pharmacy",
  new mongoose.Schema({
    user_id: String,
    name: String,
    license_number: String,
    address: String,
    verified: Boolean,
    medicines: [MedicineSchema], // <-- This line is required!
    createdAt: { type: Date, default: Date.now }
  })
);