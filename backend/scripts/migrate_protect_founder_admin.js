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

async function run() {
  const isDryRun = process.argv.includes("--dry-run");
  const isConfirmed = process.argv.includes("--confirm");

  if (!isDryRun && !isConfirmed) {
    console.error(`
================================================================================
 MedsZop Security Migration: Protect Founder / Super Admin
================================================================================
 SAFETY NOTICE:
 You must pass either --dry-run or --confirm to execute this script.

 Examples:
   node backend/scripts/migrate_protect_founder_admin.js --dry-run
   node backend/scripts/migrate_protect_founder_admin.js --confirm
================================================================================
`);
    process.exit(1);
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("[Error] MONGO_URI environment variable is required.");
    process.exit(1);
  }

  console.log(`[Connecting] Connecting to MongoDB...`);
  await mongoose.connect(mongoUri);
  console.log(`[Connected] Connected to database: ${mongoose.connection.name}`);

  try {
    const adminUser = await User.findOne({ email: TARGET_EMAIL });

    if (!adminUser) {
      console.error(`[Error] Target administrator account not found with email: ${TARGET_EMAIL}`);
      process.exit(1);
    }

    console.log(`\nFound Account:`);
    console.log(`  User ID:             ${adminUser._id}`);
    console.log(`  Name:                ${adminUser.name}`);
    console.log(`  Email:               ${adminUser.email}`);
    console.log(`  Current Role:        ${adminUser.role}`);
    console.log(`  isProtectedAdmin:    ${adminUser.isProtectedAdmin || false}`);
    console.log(`  protectedAdminType:  ${adminUser.protectedAdminType || "none"}`);
    console.log(`  protectedAt:         ${adminUser.protectedAt || "none"}`);

    if (isDryRun) {
      console.log(`\n[DRY RUN] No database modifications made.`);
      console.log(`Proposed Changes:`);
      console.log(`  isProtectedAdmin:    true`);
      console.log(`  protectedAdminType:  "founder"`);
      console.log(`  protectedAt:         ${new Date().toISOString()}`);
      console.log(`\nRun with --confirm to apply these changes.`);
      process.exit(0);
    }

    if (isConfirmed) {
      adminUser.isProtectedAdmin = true;
      adminUser.protectedAdminType = "founder";
      adminUser.protectedAt = new Date();
      adminUser.role = "admin"; // ensure admin role
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

