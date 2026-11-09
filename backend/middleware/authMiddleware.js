const jwt = require("jsonwebtoken");

/**
 * Authentication Middleware (SEC-04 / Phase 9B.1)
 * Strictly requires JWT in the Authorization header: Bearer <token>
 * Ordinary JWT tokens in query parameters (?token=) are explicitly disallowed
 * to prevent token leakage in web server access logs, browser history, and Referer headers.
 */
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
};
