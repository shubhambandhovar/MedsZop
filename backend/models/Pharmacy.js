const mongoose = require("mongoose");

const MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  genericName: String,
  category: String, // New from CSV
  company: String,
  manufacturer: String, // New from CSV
  mrp: Number,
  price: { type: Number, required: true },
  discount: Number,
  description: String,
  image: String,
  inStock: { type: Boolean, default: true },
  stock: { type: Number, default: 0 }, // New from CSV
  expiryDate: Date, // New from CSV
  batchNumber: String, // New from CSV
  requiresPrescription: { type: Boolean, default: false } // New from CSV
});

module.exports = mongoose.model(
  "Pharmacy",
  new mongoose.Schema({
    user_id: String,
    name: String,
    pharmacist_name: String,
    license_number: String,
    address: String,
    verified: Boolean,
    medicines: [MedicineSchema], // <-- This line is required!
    createdAt: { type: Date, default: Date.now }
  })
);