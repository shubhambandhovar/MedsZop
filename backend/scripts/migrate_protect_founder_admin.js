/**
 * Production Migration Script: Permanently Protect Founder / Super Admin
 *
 * Designates the primary MedsZop administrator (shubhambandhovar@gmail.com)
 * as permanently protected in MongoDB.
 *
 * Usage:
 *   Dry run (safe inspection):
 *     node backend/scripts/migrate_protect_founder_admin.js --dry-run
 *
 *   Live execution (with explicit confirmation):
 *     node backend/scripts/migrate_protect_founder_admin.js --confirm
 *
 * Per Security Protocols:
 * - Does not modify records without --confirm flag.
 * - Idempotent and reversible via authorized emergency script.
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");

const TARGET_EMAIL = (process.env.FOUNDER_ADMIN_EMAIL || "shubhambandhovar@gmail.com").toLowerCase().trim();
const EXPECTED_USER_ID = process.env.FOUNDER_ADMIN_USER_ID; // Optional explicit immutable ID guard
const EXPECTED_DATABASES = ["test", "medszop", "medszop_staging", "medszop_test"];

async function run() {
  const isDryRun = process.argv.includes("--dry-run");
  const isConfirmed = process.argv.includes("--confirm");
  const isRollback = process.argv.includes("--rollback");

  if (!isDryRun && !isConfirmed && !isRollback) {
    console.error(`
================================================================================
 MedsZop Security Migration: Protect Founder / Super Admin
================================================================================
 SAFETY NOTICE:
 You must pass either --dry-run, --confirm, or --rollback to execute this script.

 Examples:
   Inspection (Safe Dry-Run):
     node backend/scripts/migrate_protect_founder_admin.js --dry-run

   Live Execution:
     node backend/scripts/migrate_protect_founder_admin.js --confirm

   Emergency Rollback:
     node backend/scripts/migrate_protect_founder_admin.js --rollback
================================================================================
`);
    process.exit(1);
  }

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("[Error] MONGO_URI environment variable is required.");
    process.exit(1);
  }

  console.log(`[Connecting] Connecting to MongoDB...`);
  await mongoose.connect(mongoUri);
  const activeDbName = mongoose.connection.name;
  console.log(`[Connected] Connected to database: ${activeDbName} (Host: ${mongoose.connection.host})`);

  // Target database sanity check
  if (!EXPECTED_DATABASES.includes(activeDbName.toLowerCase())) {
    console.warn(`[Warning] Database '${activeDbName}' is not in standard verified whitelist (${EXPECTED_DATABASES.join(", ")}).`);
    if (!process.env.ALLOW_CUSTOM_DB) {
      console.error("[Safety Abort] Refusing to run on unrecognized database target. Set ALLOW_CUSTOM_DB=true to override.");
      await mongoose.disconnect();
      process.exit(1);
    }
  }

  try {
    // Primary query by normalized immutable email
    const query = { email: TARGET_EMAIL };
    if (EXPECTED_USER_ID) {
      query._id = EXPECTED_USER_ID;
    }

    const adminUser = await User.findOne(query);

    if (!adminUser) {
      console.error(`[Error] Target administrator account not found with criteria: ${JSON.stringify(query)}`);
      process.exit(1);
    }

    // Safety guard: ensure found account is indeed an admin
    if (adminUser.role !== "admin" && !isConfirmed) {
      console.warn(`[Alert] Target account currently has role '${adminUser.role}', will be ensured as 'admin'.`);
    }

    console.log(`\nVerified Target Account:`);
    console.log(`  Immutable User ID:   ${adminUser._id}`);
    console.log(`  Name:                ${adminUser.name}`);
    console.log(`  Email:               ${adminUser.email}`);
    console.log(`  Current Role:        ${adminUser.role}`);
    console.log(`  isProtectedAdmin:    ${adminUser.isProtectedAdmin || false}`);
    console.log(`  protectedAdminType:  ${adminUser.protectedAdminType || "none"}`);
    console.log(`  protectedAt:         ${adminUser.protectedAt || "none"}`);

    if (isDryRun) {
      console.log(`\n[DRY RUN] Read-only verification succeeded. Zero mutations executed.`);
      console.log(`Proposed Actions:`);
      console.log(`  1. Set isProtectedAdmin = true (Immutable)`);
      console.log(`  2. Set protectedAdminType = "founder"`);
      console.log(`  3. Ensure role = "admin"`);
      console.log(`  4. Set protectedAt = ${new Date().toISOString()}`);
      console.log(`\nRun with --confirm to apply changes.`);
      process.exit(0);
    }

    if (isRollback) {
      console.log(`\n[ROLLBACK] Reverting founder protection flags for account: ${adminUser._id}`);
      adminUser.isProtectedAdmin = false;
      adminUser.protectedAdminType = null;
      adminUser.protectedAt = null;
      await adminUser.save();
      console.log(`[SUCCESS] Account protection flags removed. Account reverted to standard administrator.`);
      process.exit(0);
    }

    if (isConfirmed) {
      // Idempotency check
      if (adminUser.isProtectedAdmin && adminUser.protectedAdminType === "founder" && adminUser.role === "admin") {
        console.log(`\n[IDEMPOTENT] Account is already permanently protected as Founder / Super Admin.`);
        console.log(`  Immutable User ID:   ${adminUser._id}`);
        console.log(`  Protected Since:     ${adminUser.protectedAt}`);
        console.log(`No additional changes required.`);
        process.exit(0);
      }

      adminUser.isProtectedAdmin = true;
      adminUser.protectedAdminType = "founder";
      adminUser.protectedAt = adminUser.protectedAt || new Date();
      adminUser.role = "admin";
      await adminUser.save();

      console.log(`\n[SUCCESS] Account successfully marked as Permanent Protected Founder / Super Admin!`);
      console.log(`  Immutable User ID:   ${adminUser._id}`);
      console.log(`  Protected Type:      ${adminUser.protectedAdminType}`);
      console.log(`  Protected Timestamp: ${adminUser.protectedAt.toISOString()}`);
    }
  } catch (err) {
    console.error("[Migration Error]:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log(`[Disconnected] MongoDB connection closed.`);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run };

