const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const pharmacyRoutes = require("./routes/pharmacyRoutes");
const { mongoSanitize } = require("./middleware/sanitizeMiddleware");
const safeLogger = require("./utils/logger");

dotenv.config();

// Connect DB
connectDB();

const app = express();

// Trust first proxy when running behind reverse proxy / load balancer (e.g. Nginx, Cloudflare)
app.set("trust proxy", 1);

// 1. Helmet Security Headers (Phase 9D API Hardening)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "https:", "http://localhost:*", "ws:", "wss:"]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allows authenticated prescription blobs / image fetching
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true
  })
);

// 2. Restricted CORS Origins (Phase 9D API Hardening)
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "https://medszop.com",
  "https://www.medszop.com"
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server Razorpay webhooks)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some((allowed) => {
      if (allowed === "*") return true;
      if (allowed === origin) return true;
      try {
        const allowedHost = new URL(allowed).host;
        const reqHost = new URL(origin).host;
        return allowedHost === reqHost;
      } catch (e) {
        return false;
      }
    });

    if (isAllowed) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy violation: Access from origin '${origin}' is not allowed.`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "x-razorpay-signature",
    "x-razorpay-event-id"
  ],
  credentials: true,
  maxAge: 86400 // 24 hours preflight cache
};

app.use(cors(corsOptions));

// 3. Body Parsing with Raw Buffer Preservation (SEC-08) & Size Limits
app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 4. NoSQL Query Operator Sanitization (Phase 9D Defense)
app.use(mongoSanitize);

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

// 5. Centralized Error Handling Middleware (Safe responses & error sanitization)
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV === "development";

  // Handle CORS policy rejection cleanly
  if (err.message && err.message.includes("CORS policy violation")) {
    return res.status(403).json({
      error: "Forbidden",
      message: err.message
    });
  }

  // Safe logging without leaking sensitive credentials
  safeLogger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
    ip: req.ip,
    status: err.status || 500
  });

  return res.status(err.status || 500).json({
    error: "Internal Server Error",
    message: isDev ? err.message : "An unexpected server error occurred. Please try again later."
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  safeLogger.info(`Server running on port ${PORT}`);
});
