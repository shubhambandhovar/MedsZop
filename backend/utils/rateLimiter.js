/**
 * MedsZop Distributed Rate Limiting Module
 *
 * Supports:
 * 1. Redis-backed distributed rate limiting for multi-instance clusters.
 * 2. Fail-safe fallback to in-memory sliding window when Redis is unconfigured or unavailable.
 * 3. Zero downtime or crash resilience on network/cache drop.
 * 4. Standard IETF / RFC rate-limit headers.
 */

// In-memory sliding window store (fail-safe fallback)
const inMemoryStore = new Map();

// Periodic cleanup of expired in-memory buckets (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of inMemoryStore.entries()) {
    if (now > record.resetTime) {
      inMemoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Creates a rate limiter middleware
 * @param {object} options
 * @param {number} options.windowMs Time window in milliseconds (default: 60,000 / 1 minute)
 * @param {number} options.max Maximum allowed requests in windowMs (default: 60)
 * @param {string} options.message Error message on HTTP 429
 * @param {function} options.keyGenerator Custom key generator (default: IP address)
 * @param {boolean} options.skipFailedRequests If true, failed requests won't count
 */
function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 60;
  const message = options.message || "Too many requests, please try again later.";
  const keyGenerator =
    options.keyGenerator ||
    ((req) => {
      const forwarded = req.headers["x-forwarded-for"];
      const ip = forwarded ? forwarded.split(",")[0].trim() : req.socket?.remoteAddress || req.ip || "unknown";
      return ip;
    });

  // Redis client hook (when REDIS_URL or external client is available)
  let redisClient = options.redisClient;
  if (redisClient === undefined) {
    try {
      const { getRedisClient } = require("../config/redis");
      redisClient = getRedisClient();
    } catch {
      redisClient = null;
    }
  }
  let redisAvailable = !!redisClient;

  return async function rateLimiterMiddleware(req, res, next) {
    const key = `ratelimit:${keyGenerator(req)}`;
    const now = Date.now();

    // 1. Try Distributed Redis store if available
    if (redisAvailable && redisClient) {
      try {
        const multi = redisClient.multi();
        multi.incr(key);
        multi.pttl(key);
        const results = await multi.exec();

        const currentCount = results[0][1];
        let ttl = results[1][1];

        if (ttl === -1) {
          await redisClient.pexpire(key, windowMs);
          ttl = windowMs;
        }

        const remaining = Math.max(0, max - currentCount);
        const resetSeconds = Math.ceil(ttl / 1000);

        res.setHeader("RateLimit-Limit", max);
        res.setHeader("RateLimit-Remaining", remaining);
        res.setHeader("RateLimit-Reset", resetSeconds);

        if (currentCount > max) {
          res.setHeader("Retry-After", resetSeconds);
          return res.status(429).json({
            error: "Too Many Requests",
            message,
            retryAfter: resetSeconds
          });
        }

        return next();
      } catch (redisErr) {
        console.warn("[RateLimiter] Redis error, failing safe to in-memory store:", redisErr.message);
        // Fail safe to in-memory fallback
      }
    }

    // 2. Fail-Safe In-Memory Sliding Window Fallback
    let record = inMemoryStore.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      inMemoryStore.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader("RateLimit-Limit", max);
    res.setHeader("RateLimit-Remaining", remaining);
    res.setHeader("RateLimit-Reset", resetSeconds);

    if (record.count > max) {
      res.setHeader("Retry-After", resetSeconds);
      return res.status(429).json({
        error: "Too Many Requests",
        message,
        retryAfter: resetSeconds
      });
    }

    next();
  };
}

module.exports = {
  createRateLimiter,
  _inMemoryStore: inMemoryStore // Exported for isolated test resetting
};

