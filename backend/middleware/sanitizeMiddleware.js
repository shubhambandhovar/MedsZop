/**
 * MedsZop NoSQL Injection & Input Sanitization Middleware
 * Defense against query operator injection ($where, $ne, $gt, etc.)
 * and ReDoS regex attacks.
 */

/**
 * Escapes regex special characters to prevent ReDoS and arbitrary pattern injection
 * @param {string} str Input search term
 * @returns {string} Regex-escaped string safe for MongoDB $regex queries
 */
function escapeRegex(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Recursively strips keys starting with '$' or containing '.' from objects
 * to neutralize NoSQL injection vectors.
 * @param {any} target Target object or value
 * @returns {any} Cleaned value with unsafe keys stripped
 */
function cleanNoSqlOperators(target) {
  if (!target || typeof target !== "object") {
    return target;
  }

  if (Array.isArray(target)) {
    return target.map(cleanNoSqlOperators);
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(target)) {
    // Strip operators starting with '$' or containing '.'
    if (key.startsWith("$") || key.includes(".")) {
      continue;
    }
    cleaned[key] = cleanNoSqlOperators(value);
  }
  return cleaned;
}

/**
 * Express middleware to sanitize req.body, req.query, and req.params
 */
function mongoSanitize(req, res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = cleanNoSqlOperators(req.body);
  }
  if (req.query && typeof req.query === "object") {
    req.query = cleanNoSqlOperators(req.query);
  }
  if (req.params && typeof req.params === "object") {
    req.params = cleanNoSqlOperators(req.params);
  }
  next();
}

/**
 * Extracts and validates safe pagination parameters
 * @param {object} query req.query
 * @param {number} defaultLimit Default limit (default: 50)
 * @param {number} maxLimit Maximum limit (default: 100)
 */
function parsePagination(query, defaultLimit = 50, maxLimit = 100) {
  let page = parseInt(query?.page, 10);
  let limit = parseInt(query?.limit, 10);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

module.exports = {
  escapeRegex,
  cleanNoSqlOperators,
  mongoSanitize,
  parsePagination
};

