/**
 * MedsZop Staging Verification Test Server (Port 5000)
 * Runs an isolated Express API server with synthetic fixtures
 * to power real browser Playwright customer journeys without connecting to production.
 */

const path = require("path");
module.paths.push(path.resolve(__dirname, "../backend/node_modules"));

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const fs = require("fs");

const JWT_SECRET = "staging_test_jwt_secret_phase10a";
const app = express();

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// In-Memory Synthetic Staging Fixtures
const users = new Map();
const orders = new Map();
const prescriptions = new Map();
const medicines = [
  {
    _id: "med_amox_500",
    id: "med_amox_500",
    name: "Amoxicillin 500mg Capsule",
    generic_name: "Amoxicillin",
    brand: "Moxikind",
    category: "Antibiotics",
    price: 125,
    discount_price: 110,
    requires_prescription: true,
    stock: 50,
    in_stock: true,
    description: "Broad-spectrum prescription antibiotic for bacterial infections."
  },
  {
    _id: "med_pcm_650",
    id: "med_pcm_650",
    name: "Paracetamol 650mg Tablet",
    generic_name: "Paracetamol",
    brand: "Dolo",
    category: "Fever & Pain",
    price: 35,
    discount_price: 30,
    requires_prescription: false,
    stock: 200,
    in_stock: true,
    description: "Relief from fever, headache and mild-to-moderate body pain."
  },
  {
    _id: "med_cetriz_10",
    id: "med_cetriz_10",
    name: "Cetirizine 10mg Tablet",
    generic_name: "Cetirizine",
    brand: "Cetzine",
    category: "Allergy",
    price: 22,
    discount_price: 18,
    requires_prescription: false,
    stock: 120,
    in_stock: true,
    description: "Antihistamine for seasonal allergies, sneezing and skin rashes."
  }
];

// Helper Auth Middleware
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    const token = header.split(" ")[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// 1. Health check
app.get("/health", (req, res) => res.json({ status: "healthy", environment: "isolated_staging" }));

// 2. Auth Routes
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });

  const userId = `usr_${Date.now()}`;
  const user = {
    id: userId,
    _id: userId,
    name,
    email: email.toLowerCase(),
    role: "customer",
    cart: [],
    addresses: [
      {
        _id: "addr_staging_1",
        name,
        mobile: "9876543210",
        addressLine1: "123 Staging Lane, Tech Park",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
        addressType: "Home"
      }
    ]
  };
  users.set(user.email, { ...user, password });

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
  res.status(201).json({ message: "Registered successfully", token, user });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.get(email?.toLowerCase());
  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
  const userResponse = { ...user };
  delete userResponse.password;
  res.json({ message: "Login successful", token, user: userResponse });
});

app.get("/api/auth/me", auth, (req, res) => {
  const user = Array.from(users.values()).find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  const userResponse = { ...user };
  delete userResponse.password;
  res.json({ user: userResponse });
});

// 3. Medicine Routes
app.get("/api/medicines", (req, res) => {
  const { search, category } = req.query;
  let results = [...medicines];

  if (search) {
    const q = search.toLowerCase();
    results = results.filter((m) => m.name.toLowerCase().includes(q) || m.generic_name.toLowerCase().includes(q));
  }
  if (category) {
    results = results.filter((m) => m.category.toLowerCase() === category.toLowerCase());
  }

  res.setHeader("X-Total-Count", results.length);
  res.setHeader("X-Page", 1);
  res.setHeader("X-Limit", 50);
  res.json(results);
});

app.get("/api/medicines/categories", (req, res) => {
  res.json(["Antibiotics", "Fever & Pain", "Allergy", "Cardiology", "Diabetes"]);
});

app.get("/api/medicines/:id", (req, res) => {
  const med = medicines.find((m) => m._id === req.params.id || m.id === req.params.id);
  if (!med) return res.status(404).json({ message: "Medicine not found" });
  res.json(med);
});

// 4. Cart Routes
app.get("/api/cart", auth, (req, res) => {
  const user = Array.from(users.values()).find((u) => u.id === req.user.id);
  res.json(user?.cart || []);
});

app.post("/api/cart/add", auth, (req, res) => {
  const { medicine_id, quantity } = req.body;
  const user = Array.from(users.values()).find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const med = medicines.find((m) => m._id === medicine_id);
  if (!med) return res.status(404).json({ message: "Medicine not found" });

  user.cart = user.cart || [];
  const existing = user.cart.find((c) => c.medicine_id === medicine_id);
  if (existing) {
    existing.quantity += quantity || 1;
  } else {
    user.cart.push({
      medicine_id,
      name: med.name,
      price: med.discount_price || med.price,
      quantity: quantity || 1,
      requires_prescription: med.requires_prescription
    });
  }

  res.json({ message: "Added to cart", cart: user.cart });
});

// 5. Prescription Routes
app.post("/api/prescriptions/upload", auth, (req, res) => {
  const rxId = `rx_${Date.now()}`;
  const filename = `${rxId}.pdf`;
  const rxDoc = {
    _id: rxId,
    user_id: req.user.id,
    filename,
    file_url: `/uploads/prescriptions/${filename}`,
    status: "verified"
  };
  prescriptions.set(rxId, rxDoc);
  res.status(201).json({
    message: "Prescription uploaded successfully",
    filePath: rxDoc.file_url,
    prescription: rxDoc
  });
});

// 6. Order Routes
app.post("/api/orders", auth, (req, res) => {
  const user = Array.from(users.values()).find((u) => u.id === req.user.id);
  const { address_id, payment_method, prescription_url } = req.body;

  if (!user || !user.cart || !user.cart.length) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  const hasRx = user.cart.some((c) => c.requires_prescription);
  if (hasRx && !prescription_url) {
    return res.status(400).json({ message: "Prescription is required for this order" });
  }

  const orderId = `ord_staging_${Date.now()}`;
  const total = user.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = {
    _id: orderId,
    id: orderId,
    orderNumber: `ORD-${Date.now()}`,
    user_id: user.id,
    items: [...user.cart],
    total,
    address: user.addresses[0],
    payment_method: payment_method || "cod",
    payment_status: payment_method === "online" ? "pending" : "pending",
    order_status: hasRx ? "pending_verification" : "confirmed",
    prescription_url: prescription_url || null,
    delivery_otp: "847291", // Secret OTP
    delivery_agent_id: null,
    createdAt: new Date().toISOString()
  };

  orders.set(orderId, order);
  user.cart = []; // Empty cart

  res.status(201).json({
    message: "Order placed successfully",
    order_id: order._id,
    order
  });
});

app.get("/api/orders", auth, (req, res) => {
  const userOrders = Array.from(orders.values()).filter((o) => o.user_id === req.user.id);
  res.json(userOrders);
});

app.get("/api/orders/:id", auth, (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.user_id !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }
  res.json(order);
});

// 7. Payment Verification & Sandbox
app.post("/api/payments/create-order", auth, (req, res) => {
  const { order_id } = req.body;
  const order = orders.get(order_id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  const rzpOrderId = `order_rzp_mock_${Date.now()}`;
  order.pg_order_id = rzpOrderId;
  res.json({
    amount: Math.round(order.total * 100),
    pg_order_id: rzpOrderId,
    key_id: "rzp_test_staging_gate"
  });
});

app.post("/api/payments/verify", auth, (req, res) => {
  const { order_id, pg_order_id, pg_payment_id } = req.body;
  const order = orders.get(order_id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  order.payment_status = "paid";
  order.pg_payment_id = pg_payment_id || `pay_mock_${Date.now()}`;
  res.json({ verified: true, message: "Payment verified successfully" });
});

// 8. Pharmacy Dashboard Order Queue & Acceptance
app.get("/api/pharmacy/orders", auth, (req, res) => {
  res.json(Array.from(orders.values()));
});

app.put("/api/pharmacy/orders/:id/accept", auth, (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  order.order_status = "processing";
  res.json({ message: "Order accepted by pharmacy", order });
});

// 9. Delivery Partner Queue, Assignment & OTP Verification
app.get("/api/delivery/orders", auth, (req, res) => {
  const sanitized = Array.from(orders.values()).map((o) => {
    const copy = { ...o };
    delete copy.delivery_otp; // SEC-03 OTP redaction
    return copy;
  });
  res.json(sanitized);
});

app.post("/api/delivery/accept/:id", auth, (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  order.delivery_agent_id = req.user.id;
  order.order_status = "out_for_delivery";
  res.json({ message: "Delivery accepted", order });
});

app.post("/api/delivery/complete/:id", auth, (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  const { otp } = req.body;
  if (!otp || otp.toString() !== order.delivery_otp) {
    return res.status(400).json({ message: "Invalid OTP. Delivery verification failed." });
  }
  order.order_status = "delivered";
  order.payment_status = "paid";
  res.json({ message: "Delivery completed successfully", order });
});

const PORT = 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 MedsZop Staging Verification Server listening on port ${PORT}`);
});

process.on("SIGTERM", () => server.close());
process.on("SIGINT", () => server.close());

