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

module.exports = mongoose.model("Medicine", medicineSchema);
