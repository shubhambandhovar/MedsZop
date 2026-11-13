const mongoose = require("mongoose");

/**
 * Strict Database Safety Guard
 * Prevents test suites or staging tasks from mutating or connecting to production Atlas clusters.
 */
function assertDatabaseSafety(uri, env = process.env.NODE_ENV) {
  if (!uri) {
    throw new Error("Database URI is missing or undefined.");
  }

  const lower = uri.toLowerCase();

  // In test mode, strictly reject any cloud Atlas clusters or remote hosts
  if (env === "test") {
    if (lower.includes("mongodb.net") || lower.includes("cluster0") || lower.includes("atlas")) {
      throw new Error(
        `🚨 CRITICAL SAFETY INTERVENTION: Attempted to run test suite against cloud/production cluster: ${uri}. Connection aborted immediately.`
      );
    }

    const isApprovedHost = lower.includes("127.0.0.1") || lower.includes("localhost");
    const isApprovedDb = lower.includes("medszop_test") || lower.includes("test");
    if (!isApprovedHost || !isApprovedDb) {
      throw new Error(
        `🚨 CRITICAL SAFETY INTERVENTION: Test mode requires isolated local test database (e.g. mongodb://127.0.0.1:27018/medszop_test). Received: ${uri}`
      );
    }
  }

  // In staging mode, strictly enforce the exact permitted database name 'medszop_staging'
  if (env === "staging") {
    let dbPath = "";
    try {
      const u = new URL(uri);
      dbPath = (u.pathname || "").replace(/^\//, "").toLowerCase();
    } catch {
      dbPath = (uri.split("/").pop() || "").split("?")[0].toLowerCase();
    }

    if (dbPath !== "medszop_staging") {
      throw new Error(
        `🚨 CRITICAL SAFETY INTERVENTION: Staging environment attempted to connect to unauthorized database '${dbPath || "(empty)"}'. Staging is strictly restricted to the exact database 'medszop_staging'. Connection aborted.`
      );
    }
  }
}

const connectDB = async (customUri) => {
  try {
    const uri = customUri || process.env.MONGO_URI || process.env.MONGODB_URI;
    assertDatabaseSafety(uri, process.env.NODE_ENV);

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host} (Database: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
module.exports.assertDatabaseSafety = assertDatabaseSafety;
