const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({

  name: String,
  generic_name: String,
  brand: String,
  category: String,
  description: String,

  price: Number,
  discount_price: Number,

  stock: Number,
  requires_prescription: Boolean,

  dosage_form: String,
  strength: String,
  manufacturer: String,

  image_url: String,

  pharmacy_id: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

// Recommended Compound, Text, and Field Indexes (Phase 9D)
medicineSchema.index({ name: 1, category: 1 });
medicineSchema.index({ generic_name: 1 });
medicineSchema.index({ brand: 1 });
medicineSchema.index({ category: 1 });
medicineSchema.index({ pharmacy_id: 1 });
medicineSchema.index({ name: "text", generic_name: "text", brand: "text" });

module.exports = mongoose.model("Medicine", medicineSchema);
