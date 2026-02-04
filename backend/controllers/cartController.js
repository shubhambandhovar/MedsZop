const User = require("../models/User");

const Medicine = require("../models/Medicine");
const Pharmacy = require("../models/Pharmacy");

exports.getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const cartItems = [];

    for (const item of user.cart) {
      if (!item.medicine_id) continue;

      // 1. Try Global Medicine
      let medicine = await Medicine.findById(item.medicine_id).lean();

      // 2. Try Pharmacy Medicine
      if (!medicine) {
        try {
          const pharmacy = await Pharmacy.findOne(
            { "medicines._id": item.medicine_id },
            { "medicines.$": 1, name: 1 }
          );
          if (pharmacy && pharmacy.medicines && pharmacy.medicines.length > 0) {
            const m = pharmacy.medicines[0];
            medicine = {
              id: m._id.toString(),
              _id: m._id,
              name: m.name,
              generic_name: m.genericName,
              brand: m.company,
              price: m.price || 0,
              discount_price: (m.mrp > m.price) ? m.price : null,
              image_url: m.image,
              pharmacy_id: pharmacy._id,
              pharmacy_name: pharmacy.name
            };
          }
        } catch (e) {
          console.error("Pharmacy lookup error for", item.medicine_id, e);
        }
      }

      if (medicine) {
        cartItems.push({
          medicine: medicine,
          quantity: item.quantity || 1
        });
      }
    }

    const total = cartItems.reduce((sum, item) => {
      const price = item.medicine.discount_price || item.medicine.price || 0;
      return sum + (price * (item.quantity || 1));
    }, 0);

    res.json({ items: cartItems, total });
  } catch (err) {
    console.error("getCart Error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { items } = req.body;

    user.cart = items;
    await user.save();

    res.json({ message: "Cart updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "User not authenticated" });

    const { medicine_id, quantity } = req.body;
    if (!medicine_id) {
      return res.status(400).json({ message: "Medicine ID is required" });
    }

    const qty = Number(quantity) || 1;
    const medIdStr = String(medicine_id);

    // Try to update an existing item
    const updateResult = await User.updateOne(
      { _id: userId, "cart.medicine_id": medIdStr },
      { $inc: { "cart.$.quantity": qty } }
    );

    // If item didn't exist, push a new one
    if (updateResult.modifiedCount === 0) {
      await User.updateOne(
        { _id: userId },
        { $push: { cart: { medicine_id: medIdStr, quantity: qty } } }
      );
    }

    res.json({ message: "Added to cart success" });
  } catch (err) {
    console.error("addToCart Error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.clearCart = async (req, res) => {
  const user = await User.findById(req.user.id);
  user.cart = [];
  await user.save();
  res.json({ message: "Cart cleared" });
};
