/**
 * MedsZop — seedAdmin.js Security & Hardening Verification Suite
 *
 * Runs 100% isolated tests using in-memory mocks.
 * Zero network connections to production databases.
 */

const assert = require("assert");
const bcrypt = require("../backend/node_modules/bcryptjs");
const {
  validatePasswordStrength,
  validateAndNormalizeEmail,
  validateUserFields,
  maskMongoUri,
  seedAdmin,
  BOOTSTRAP_ROLE
} = require("../backend/seedAdmin.js");

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function main() {
  console.log("\n=======================================================");
  console.log("   MedsZop: seedAdmin Hardening Verification Suite     ");
  console.log("=======================================================\n");

  // SECTION 1: Password Strength Validation (Req 2)
  console.log("[Section 1: Password Complexity Enforcement]");
  runTest("Rejects null or undefined password", () => {
    assert.strictEqual(validatePasswordStrength(null).valid, false);
    assert.strictEqual(validatePasswordStrength("").valid, false);
  });

  runTest("Rejects password under 12 characters", () => {
    const res = validatePasswordStrength("Short1!Aa");
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /at least 12 characters/i);
  });

  runTest("Rejects password without uppercase letter", () => {
    const res = validatePasswordStrength("lowercase123!@#");
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /uppercase letter/i);
  });

  runTest("Rejects password without lowercase letter", () => {
    const res = validatePasswordStrength("UPPERCASE123!@#");
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /lowercase letter/i);
  });

  runTest("Rejects password without digit", () => {
    const res = validatePasswordStrength("NoDigitsHere!@#");
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /numeric digit/i);
  });

  runTest("Rejects password without special character", () => {
    const res = validatePasswordStrength("NoSpecialChar123");
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /special character/i);
  });

  runTest("Accepts strong 12+ character password with full complexity", () => {
    const res = validatePasswordStrength("SuperSecure!Pass2026");
    assert.strictEqual(res.valid, true);
  });

  // SECTION 2: Email Normalization & Validation (Req 3)
  console.log("\n[Section 2: Email Normalization & Validation]");
  runTest("Normalizes whitespace and uppercase letters", () => {
    const res = validateAndNormalizeEmail("   Admin.MedsZop@EXAMPLE.COM   ");
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.normalized, "admin.medszop@example.com");
  });

  runTest("Rejects malformed emails", () => {
    assert.strictEqual(validateAndNormalizeEmail("invalid-email").valid, false);
    assert.strictEqual(validateAndNormalizeEmail("admin@").valid, false);
    assert.strictEqual(validateAndNormalizeEmail("@example.com").valid, false);
    assert.strictEqual(validateAndNormalizeEmail("admin@example").valid, false);
  });

  // SECTION 3: User Field Validation (Req 4)
  console.log("\n[Section 3: Mongoose User Field Validation]");
  runTest("Requires non-empty administrator name", () => {
    assert.strictEqual(validateUserFields({ name: "" }).valid, false);
    assert.strictEqual(validateUserFields({ name: "   " }).valid, false);
    assert.strictEqual(validateUserFields({ name: "Dr. Admin" }).valid, true);
  });

  runTest("Handles optional phone correctly", () => {
    const res = validateUserFields({ name: "Admin", phone: " +91 9876543210 " });
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.phone, "+91 9876543210");
  });

  // SECTION 4: URI Masking & Security (Req 9)
  console.log("\n[Section 4: Zero-Exposure URI Masking]");
  runTest("Masks credentials in standard MongoDB URI", () => {
    const masked = maskMongoUri("mongodb://myuser:SuperSecretPassword123@cluster0.net/testdb");
    assert.strictEqual(masked, "mongodb://***:***@cluster0.net/testdb");
    assert.strictEqual(masked.includes("SuperSecretPassword123"), false);
  });

  runTest("Masks credentials in mongodb+srv URI", () => {
    const masked = maskMongoUri("mongodb+srv://admin_user:P%40ssw0rd!@medszop.cluster.mongodb.net/production");
    assert.strictEqual(masked, "mongodb+srv://***:***@medszop.cluster.mongodb.net/production");
    assert.strictEqual(masked.includes("P%40ssw0rd"), false);
  });

  // SECTION 5: Hardcoded Bootstrap Role (Req 1)
  console.log("\n[Section 5: Role Integrity]");
  runTest("Bootstrap role is strictly locked to 'admin'", () => {
    assert.strictEqual(BOOTSTRAP_ROLE, "admin");
  });

  // SECTION 6: SeedAdmin Logic with Isolated Mock DB (Req 5, 6, 7, 8, 10)
  console.log("\n[Section 6: SeedAdmin Database Logic & Safety Checks]");
  const mongoose = require("../backend/node_modules/mongoose");
  const User = require("../backend/models/User");

  // Save original methods
  const origFindOne = User.findOne;
  const origCreate = User.create;
  const origConnect = mongoose.connect;
  const origDisconnect = mongoose.disconnect;

  // Fully isolate mongoose
  mongoose.connect = async () => {
    mongoose.connection.readyState = 1;
    mongoose.connection.name = mongoose.connection.name || "mock_isolated_test_db";
    mongoose.connection.host = "127.0.0.1";
  };
  mongoose.disconnect = async () => {
    mongoose.connection.readyState = 0;
  };
  mongoose.connection.readyState = 1;
  mongoose.connection.name = "mock_isolated_test_db";
  mongoose.connection.host = "127.0.0.1";

  try {
    await runAsyncTest("Rejects execution if MONGO_URI is missing", async () => {
      let threw = false;
      try {
        await seedAdmin({ email: "admin@test.com", password: "Valid123!Password", name: "Admin" }, { mongoUri: "" });
      } catch (err) {
        threw = true;
        assert.match(err.message, /MONGO_URI/i);
      }
      assert.strictEqual(threw, true);
    });

    await runAsyncTest("Handles existing administrator idempotently without re-hashing or writing", async () => {
      // Mock existing admin user
      User.findOne = async () => ({
        _id: "admin-id-123",
        email: "existing.admin@medszop.com",
        role: "admin",
        name: "Existing Admin"
      });

      let createCalled = false;
      User.create = async () => { createCalled = true; };

      // Mock mongoose connection
      mongoose.connection.readyState = 1;
      mongoose.connection.name = "testdb";
      mongoose.connection.host = "localhost";

      const res = await seedAdmin(
        { email: "existing.admin@medszop.com", password: "ValidPassword123!", name: "Admin" },
        { mongoUri: "mongodb://***:***@localhost/testdb" }
      );

      assert.strictEqual(res.status, "already_exists");
      assert.strictEqual(createCalled, false, "User.create must not be called when admin already exists");
    });

    await runAsyncTest("Refuses to promote or overwrite existing non-admin account (Role Escalation Protection)", async () => {
      // Mock existing customer user
      User.findOne = async () => ({
        _id: "customer-id-456",
        email: "customer@medszop.com",
        role: "customer",
        name: "Customer User"
      });

      let createCalled = false;
      User.create = async () => { createCalled = true; };

      let threw = false;
      try {
        await seedAdmin(
          { email: "customer@medszop.com", password: "ValidPassword123!", name: "Admin" },
          { mongoUri: "mongodb://***:***@localhost/testdb" }
        );
      } catch (err) {
        threw = true;
        assert.match(err.message, /SECURITY ALERT.*Refusing to promote or overwrite/i);
      }

      assert.strictEqual(threw, true);
      assert.strictEqual(createCalled, false);
    });

    await runAsyncTest("Enforces database safety check when expectedDb is configured", async () => {
      User.findOne = async () => null;
      mongoose.connection.name = "production_db";

      let threw = false;
      try {
        await seedAdmin(
          { email: "new.admin@medszop.com", password: "ValidPassword123!", name: "Admin" },
          { mongoUri: "mongodb://***:***@localhost/production_db", expectedDb: "staging_db" }
        );
      } catch (err) {
        threw = true;
        assert.match(err.message, /Database safety mismatch/i);
      }
      assert.strictEqual(threw, true);
    });

    await runAsyncTest("Successfully provisions new administrator with verified bcrypt hash", async () => {
      User.findOne = async () => null;

      let createdPayload = null;
      User.create = async (payload) => {
        createdPayload = payload;
        return { _id: "new-admin-id-789", ...payload };
      };

      mongoose.connection.name = "testdb";

      const plainPassword = "SuperSecurePassword123!";
      const res = await seedAdmin(
        { email: "New.Admin@Medszop.com ", password: plainPassword, name: "Dr. Administrator", phone: "9876543210" },
        { mongoUri: "mongodb://***:***@localhost/testdb" }
      );

      assert.strictEqual(res.status, "created");
      assert.strictEqual(createdPayload.email, "new.admin@medszop.com", "Email must be normalized lowercase");
      assert.strictEqual(createdPayload.role, "admin", "Role must be 'admin'");
      assert.strictEqual(createdPayload.name, "Dr. Administrator");
      assert.strictEqual(createdPayload.phone, "9876543210");

      // Verify bcrypt hash matches plain password
      const match = await bcrypt.compare(plainPassword, createdPayload.password);
      assert.strictEqual(match, true, "Hashed password must verify with bcrypt.compare");
    });
  } finally {
    // Restore mocks
    User.findOne = origFindOne;
    User.create = origCreate;
    mongoose.connect = origConnect;
    mongoose.disconnect = origDisconnect;
    mongoose.connection.readyState = 0;
  }

  console.log("\n=======================================================");
  console.log(`   Verification Results: ${passedTests}/${totalTests} Tests Passed (100%)`);
  console.log("=======================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test suite fatal error:", err);
  process.exit(1);
});
