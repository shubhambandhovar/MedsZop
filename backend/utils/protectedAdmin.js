/**
 * Protected Founder / Super Admin Security Authority (Phase 3)
 *
 * The primary MedsZop administrator account (associated with shubhambandhovar@gmail.com)
 * is permanently protected against deletion, deactivation, demotion, anonymization,
 * and bulk destructive operations.
 *
 * Protection is anchored to:
 * 1. Database-backed immutable user attributes: `isProtectedAdmin === true`, `protectedAdminType: "founder"`
 * 2. Hardened fallback guard for the designated founder email to prevent any runtime bypass.
 */

const FOUNDER_ADMIN_EMAIL = (
  process.env.FOUNDER_ADMIN_EMAIL || "shubhambandhovar@gmail.com"
).toLowerCase().trim();

/**
 * Check whether a user record represents the protected Founder / Super Admin
 * @param {Object} user - Mongoose User document or plain user object
 * @returns {Boolean}
 */
function isProtectedAdminUser(user) {
  if (!user) return false;

  // 1. Primary check: Database-backed immutable protection flag
  if (user.isProtectedAdmin === true) {
    return true;
  }

  // 2. Secondary hardened fallback guard: Founder email identity
  if (user.email && typeof user.email === "string") {
    const normalized = user.email.toLowerCase().trim();
    if (normalized === FOUNDER_ADMIN_EMAIL) {
      return true;
    }
  }

  return false;
}

/**
 * Return standard error response for blocked operations against the protected admin
 */
function getProtectedAdminViolationError(operation) {
  const messages = {
    DELETE: "Action blocked: The primary Founder / Super Admin account is permanently protected against deletion.",
    DEACTIVATE: "Action blocked: The primary Founder / Super Admin account is permanently protected against deactivation.",
    DEMOTE: "Action blocked: The primary Founder / Super Admin account role cannot be demoted or changed.",
    ANONYMIZE: "Action blocked: The primary Founder / Super Admin account cannot be anonymized.",
    TAMPER_FLAG: "Action blocked: The protection flags on the primary Founder / Super Admin account cannot be altered.",
  };

  return {
    statusCode: 403,
    code: "PROTECTED_ADMIN_IMMUTABLE",
    message: messages[operation] || "Action blocked: Operation not permitted on protected administrator.",
  };
}

module.exports = {
  FOUNDER_ADMIN_EMAIL,
  isProtectedAdminUser,
  getProtectedAdminViolationError,
};

