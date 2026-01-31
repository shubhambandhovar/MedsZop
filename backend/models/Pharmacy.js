const mongoose = require("mongoose");

const MedicineSchema = new mongoose.Schema({
  name: String,
  price: Number
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