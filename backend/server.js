const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const pharmacyRoutes = require("./routes/pharmacyRoutes");
dotenv.config();

// Connect DB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

// SEC-04: Secure Prescription File Access
// Medical prescriptions contain sensitive patient data and must never be served via unauthenticated static routes.
const authMiddleware = require("./middleware/authMiddleware");
const { getPrescriptionFile } = require("./controllers/prescriptionController");

app.get("/uploads/prescriptions/:filename", authMiddleware, getPrescriptionFile);
app.get("/api/uploads/prescriptions/:filename", authMiddleware, getPrescriptionFile);

// Deny any unauthenticated access to prescription directory
app.use("/uploads/prescriptions", (req, res) => {
  return res.status(401).json({ message: "Authentication required to access prescriptions" });
});
app.use("/api/uploads/prescriptions", (req, res) => {
  return res.status(401).json({ message: "Authentication required to access prescriptions" });
});

// Non-sensitive public uploads (e.g., medicine catalogs) can still be served statically
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/medicines", require("./routes/medicineRoutes"));
app.use("/api/prescriptions", require("./routes/prescriptionRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/onboarding", require("./routes/onboardingRoutes"));
app.use("/api/doctor", require("./routes/doctorRoutes"));
console.log("🛠️ Registering Pharmacy Routes...");
app.use("/api/pharmacy", require("./routes/pharmacyRoutes"));
app.use("/api/delivery", require("./routes/deliveryRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/addresses", require("./routes/addressRoutes"));

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to MedsZop API", status: "running" });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
