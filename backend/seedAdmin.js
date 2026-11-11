require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");
const { Writable } = require("stream");
const User = require("./models/User");

// Strictly locked bootstrap role
const BOOTSTRAP_ROLE = "admin";

/**
 * Mask sensitive connection strings
 */
function maskMongoUri(uri) {
  if (!uri) return "[NOT_SET]";
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
  } catch {
    return "[MALFORMED_URI]";
  }
}

/**
 * Validate password complexity (at least 12 chars, uppercase, lowercase, digit, special character)
 */
function validatePasswordStrength(password) {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "Password must be a non-empty string." };
  }
  if (password.length < 12) {
    return { valid: false, error: "Password must be at least 12 characters in length." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one uppercase letter (A-Z)." };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one lowercase letter (a-z)." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one numeric digit (0-9)." };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one special character." };
  }
  return { valid: true };
}

/**
 * Normalize and validate administrator email
 */
function validateAndNormalizeEmail(email) {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email must be a non-empty string." };
  }
  const normalized = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(normalized)) {
    return { valid: false, error: "Invalid email format." };
  }
  return { valid: true, normalized };
}

/**
 * Validate required user fields
 */
function validateUserFields({ name, phone }) {
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return { valid: false, error: "Administrator name is required and cannot be empty." };
  }
  if (phone && (typeof phone !== "string" || phone.trim().length === 0)) {
    return { valid: false, error: "Phone number, if provided, must be a valid string." };
  }
  return { valid: true, name: name.trim(), phone: (phone || "").trim() };
}

/**
 * Interactive masked prompt for password input in TTY sessions
 */
async function promptMasked(promptText) {
  return new Promise((resolve) => {
    let muted = false;
    const mutableStdout = new Writable({
      write: (chunk, enc, cb) => {
        if (!muted) process.stdout.write(chunk, enc);
        cb();
      }
    });

    const rl = readline.createInterface({
      input: process.stdin,
      output: mutableStdout,
      terminal: true
    });

    process.stdout.write(promptText);
    muted = true;
    rl.question("", (ans) => {
      rl.close();
      process.stdout.write("\n");
      resolve(ans);
    });
  });
}

/**
 * Plain interactive prompt
 */
async function promptPlain(promptText) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(promptText, (ans) => {
      rl.close();
      resolve(ans);
    });
  });
}

/**
 * Acquire admin credentials from environment or interactive TTY
 */
async function acquireCredentials() {
  let email = process.env.ADMIN_EMAIL;
  let password = process.env.ADMIN_PASSWORD;
  let name = process.env.ADMIN_NAME;
  let phone = process.env.ADMIN_PHONE;

  if (process.stdin.isTTY) {
    if (!email) {
      email = await promptPlain("Enter Administrator Email: ");
    }
    if (!name) {
      name = await promptPlain("Enter Administrator Full Name (default: System Administrator): ");
      if (!name || !name.trim()) name = "System Administrator";
    }
    if (!password) {
      password = await promptMasked("Enter Administrator Password (hidden, min 12 chars): ");
    }
  }

  return { email, password, name, phone };
}

/**
 * Core admin provisioning logic
 */
async function seedAdmin(credentials = null, options = {}) {
  const mongoUri = options.mongoUri !== undefined ? options.mongoUri : process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI environment variable is required.");
  }

  // 1. Acquire and validate credentials
  const creds = credentials || await acquireCredentials();

  const emailCheck = validateAndNormalizeEmail(creds.email);
  if (!emailCheck.valid) {
    throw new Error(`Email validation error: ${emailCheck.error}`);
  }
  const normalizedEmail = emailCheck.normalized;

  const passwordCheck = validatePasswordStrength(creds.password);
  if (!passwordCheck.valid) {
    throw new Error(`Password policy error: ${passwordCheck.error}`);
  }

  const fieldCheck = validateUserFields({ name: creds.name, phone: creds.phone });
  if (!fieldCheck.valid) {
    throw new Error(`Field validation error: ${fieldCheck.error}`);
  }

  let disconnectAfter = false;
  try {
    // 2. Connect to database if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
      disconnectAfter = true;
    }

    const dbName = mongoose.connection.name;
    const dbHost = mongoose.connection.host;
    console.log(`[DATABASE] Verified connection to host: '${dbHost}', database: '${dbName}' (URI: ${maskMongoUri(mongoUri)})`);

    // Verify expected database name if specified in options or environment
    const expectedDb = options.expectedDb || process.env.EXPECTED_DB_NAME;
    if (expectedDb && dbName !== expectedDb) {
      throw new Error(`Database safety mismatch: Connected to '${dbName}', expected '${expectedDb}'. Aborting write.`);
    }

    // 3. Check for existing account
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.role === BOOTSTRAP_ROLE) {
        console.log(`[INFO] Administrator account for '${normalizedEmail}' already exists. Idempotent check passed - no data modified.`);
        return { status: "already_exists", user: existingUser };
      } else {
        throw new Error(`SECURITY ALERT: Account '${normalizedEmail}' already exists with non-admin role '${existingUser.role}'. Refusing to promote or overwrite existing account.`);
      }
    }

    // 4. Secure password hashing
    const hashedPassword = await bcrypt.hash(creds.password, 10);

    // 5. Create administrator account
    const newAdmin = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      name: fieldCheck.name,
      phone: fieldCheck.phone,
      role: BOOTSTRAP_ROLE
    });

    console.log(`[SUCCESS] Initial administrator account created successfully.`);
    console.log(`          Email: ${normalizedEmail}`);
    console.log(`          Name:  ${fieldCheck.name}`);
    console.log(`          Role:  ${BOOTSTRAP_ROLE}`);
    console.log(`          DB:    ${dbName}`);

    return { status: "created", user: newAdmin };
  } finally {
    if (disconnectAfter && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

// Direct execution entry point
if (require.main === module) {
  seedAdmin()
    .then((result) => {
      process.exit(0);
    })
    .catch((err) => {
      console.error(`[FATAL ERROR] ${err.message}`);
      process.exit(1);
    });
}

module.exports = {
  seedAdmin,
  validatePasswordStrength,
  validateAndNormalizeEmail,
  validateUserFields,
  maskMongoUri,
  BOOTSTRAP_ROLE
};
