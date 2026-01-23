const Order = require("../models/Order");
const User = require("../models/User");
const Medicine = require("../models/Medicine");


// CREATE ORDER
exports.createOrder = async (req, res) => {

  try {

    const user = await User.findById(req.user.id);

    if (!user.cart.length)
      return res.status(400).json({ message: "Cart empty" });

    let items = [];
    let total = 0;

    for (let cartItem of user.cart) {

      const medicine = await Medicine.findById(cartItem.medicine_id);

      const price = medicine.discount_price || medicine.price;

      items.push({
        medicine_id: medicine._id,
        name: medicine.name,
        price,
        quantity: cartItem.quantity
      });

      total += price * cartItem.quantity;
    }

    const order = await Order.create({
      user_id: user._id,
      items,
      total,
      address: req.body.address,
      payment_method: req.body.payment_method
    });

    // Clear cart
    user.cart = [];
    await user.save();

    res.status(201).json(order);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// GET USER ORDERS
exports.getOrders = async (req, res) => {

  try {

    const orders = await Order.find({ user_id: req.user.id })
                              .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// UPDATE ORDER STATUS (Admin / Pharmacy / Delivery)
exports.updateOrderStatus = async (req, res) => {

  try {

    const order = await Order.findById(req.params.id);

    if (!order)
      return res.status(404).json({ message: "Order not found" });

    order.order_status = req.body.status;

    order.status_history.push({
      status: req.body.status,
      timestamp: new Date()
    });

    await order.save();

    res.json({ message: "Status updated" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
