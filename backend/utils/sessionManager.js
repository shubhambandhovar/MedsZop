const crypto = require("crypto");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Session = require("../models/Session");
const { getRedisClient } = require("../config/redis");

/**
 * In-memory fallback session store for resilient fail-safe operation
 * (active when Redis is unavailable and during offline unit testing/disconnects)
 */
const inMemorySessionStore = new Map();

/**
 * Role-Specific Session Policies (Phase 2)
 */
const ROLE_POLICIES = {
  admin: {
    idleTimeoutMs: 30 * 60 * 1000,          // 30 minutes
    absoluteLifetimeMs: 2 * 60 * 60 * 1000, // 2 hours
    jwtExpiry: "2h",
  },
  customer: {
    idleTimeoutMs: 60 * 60 * 1000,          // 60 minutes
    absoluteLifetimeMs: 24 * 60 * 60 * 1000, // 24 hours
    jwtExpiry: "24h",
  },
  pharmacy: {
    idleTimeoutMs: 30 * 60 * 1000,          // 30 minutes
    absoluteLifetimeMs: 8 * 60 * 60 * 1000, // 8 hours
    jwtExpiry: "8h",
  },
  doctor: {
    idleTimeoutMs: 30 * 60 * 1000,          // 30 minutes
    absoluteLifetimeMs: 8 * 60 * 60 * 1000, // 8 hours
    jwtExpiry: "8h",
  },
  delivery: {
    idleTimeoutMs: 60 * 60 * 1000,          // 60 minutes
    absoluteLifetimeMs: 12 * 60 * 60 * 1000, // 12 hours
    jwtExpiry: "12h",
  },
};

/**
 * Resolve session policy based on user role
 */
function getPolicyForRole(role) {
  return ROLE_POLICIES[role] || ROLE_POLICIES.customer;
}

/**
 * Parse client device info from User-Agent
 */
function parseDeviceType(userAgent = "") {
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    return "mobile";
  }
  if (ua.includes("ipad") || ua.includes("tablet")) {
    return "tablet";
  }
  return "desktop";
}

/**
 * Safe Redis cache helper (Gracefully degrades to null on Redis downtime/missing)
 */
function getRedis() {
  try {
    return getRedisClient();
  } catch {
    return null;
  }
}

/**
 * Create a new cryptographically secured session
 */
async function createSession({ userId, role, ipAddress = "", userAgent = "" }) {
  const policy = getPolicyForRole(role);
  const sessionId = crypto.randomUUID();
  const now = new Date();
  const absoluteExpiresAt = new Date(now.getTime() + policy.absoluteLifetimeMs);
  const deviceType = parseDeviceType(userAgent);

  const sessionData = {
    sessionId,
    userId: userId.toString(),
    role,
    createdAt: now,
    lastActivityAt: now,
    absoluteExpiresAt,
    idleTimeoutMs: policy.idleTimeoutMs,
    isValid: true,
    ipAddress,
    userAgent,
    deviceType,
    revokedAt: null,
    revocationReason: "",
  };

  // Always keep in fast in-memory store
  inMemorySessionStore.set(sessionId, sessionData);

  // Persist to MongoDB if connection is active
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      await Session.create(sessionData);
    } catch (dbErr) {
      console.warn("[SessionManager] MongoDB session insert error:", dbErr.message);
    }
  }

  // Cache in Redis if connected (TTL in seconds)
  const redis = getRedis();
  if (redis) {
    try {
      const ttlSeconds = Math.max(1, Math.ceil(policy.absoluteLifetimeMs / 1000));
      await redis.setex(
        `session:${sessionId}`,
        ttlSeconds,
        JSON.stringify({
          ...sessionData,
          createdAt: now.toISOString(),
          lastActivityAt: now.toISOString(),
          absoluteExpiresAt: absoluteExpiresAt.toISOString(),
        })
      );
    } catch (redisErr) {
      console.warn("[SessionManager] Redis cache set failed, relying on DB/Memory:", redisErr.message);
    }
  }

  // Mint signed JWT containing sessionId
  const token = jwt.sign(
    {
      id: userId.toString(),
      role,
      sessionId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: policy.jwtExpiry,
    }
  );

  return {
    token,
    session: {
      sessionId,
      absoluteExpiresAt,
      idleTimeoutMs: policy.idleTimeoutMs,
      idleTimeoutMinutes: Math.round(policy.idleTimeoutMs / 60000),
      absoluteLifetimeMinutes: Math.round(policy.absoluteLifetimeMs / 60000),
      role,
      createdAt: now,
    },
  };
}

/**
 * Validate an active session against idle timeout, absolute lifetime, and revocation
 */
async function validateSession(sessionId, { isPassive = false } = {}) {
  if (!sessionId) {
    return { valid: false, reason: "NO_SESSION_ID" };
  }

  const nowMs = Date.now();
  let session = null;
  const redis = getRedis();

  // 1. Try Redis first
  if (redis) {
    try {
      const cached = await redis.get(`session:${sessionId}`);
      if (cached) {
        session = JSON.parse(cached);
        session.createdAt = new Date(session.createdAt);
        session.lastActivityAt = new Date(session.lastActivityAt);
        session.absoluteExpiresAt = new Date(session.absoluteExpiresAt);
      }
    } catch (redisErr) {
      console.warn("[SessionManager] Redis get error:", redisErr.message);
    }
  }

  // 2. Try In-Memory cache next
  if (!session && inMemorySessionStore.has(sessionId)) {
    session = inMemorySessionStore.get(sessionId);
  }

  // 3. Fallback to MongoDB if connection is ready
  if (!session && mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const doc = await Session.findOne({ sessionId });
      if (doc) {
        session = doc.toObject();
        inMemorySessionStore.set(sessionId, session);
      }
    } catch (dbErr) {
      console.warn("[SessionManager] DB session lookup error:", dbErr.message);
    }
  }

  if (!session) {
    return { valid: false, reason: "SESSION_NOT_FOUND" };
  }

  // 1. Check explicit revocation
  if (!session.isValid) {
    return { valid: false, reason: "SESSION_REVOKED", details: session.revocationReason };
  }

  // 2. Check Absolute Session Lifetime
  const absoluteExpiryMs = new Date(session.absoluteExpiresAt).getTime();
  if (nowMs > absoluteExpiryMs) {
    await revokeSession(sessionId, "ABSOLUTE_LIFETIME_REACHED");
    return { valid: false, reason: "SESSION_ABSOLUTE_TIMEOUT" };
  }

  // 3. Check Idle Timeout
  const lastActivityMs = new Date(session.lastActivityAt).getTime();
  const idleLimitMs = session.idleTimeoutMs || 30 * 60 * 1000;
  if (nowMs - lastActivityMs > idleLimitMs) {
    await revokeSession(sessionId, "INACTIVITY_TIMEOUT");
    return { valid: false, reason: "SESSION_IDLE_TIMEOUT" };
  }

  // 4. Update activity timestamp (Throttle MongoDB writes to max once per 45s unless force)
  if (!isPassive) {
    const elapsedSinceLastUpdate = nowMs - lastActivityMs;
    const now = new Date();

    session.lastActivityAt = now;
    inMemorySessionStore.set(sessionId, session);

    // Update Redis immediately
    if (redis) {
      try {
        const ttlSeconds = Math.max(1, Math.ceil((absoluteExpiryMs - nowMs) / 1000));
        await redis.setex(`session:${sessionId}`, ttlSeconds, JSON.stringify(session));
      } catch (redisErr) {
        // non-blocking
      }
    }

    // Throttle DB updates to reduce write IOPS
    if (elapsedSinceLastUpdate > 45000 && mongoose.connection && mongoose.connection.readyState === 1) {
      Session.updateOne(
        { sessionId },
        { $set: { lastActivityAt: now } }
      ).catch((err) => console.warn("[SessionManager] Activity update DB error:", err.message));
    }
  }

  return {
    valid: true,
    session,
    idleRemainingMs: Math.max(0, idleLimitMs - (nowMs - lastActivityMs)),
    absoluteRemainingMs: Math.max(0, absoluteExpiryMs - nowMs),
  };
}

/**
 * Revoke a specific session
 */
async function revokeSession(sessionId, reason = "USER_LOGOUT") {
  if (!sessionId) return;
  const now = new Date();

  // In-memory
  if (inMemorySessionStore.has(sessionId)) {
    const s = inMemorySessionStore.get(sessionId);
    s.isValid = false;
    s.revokedAt = now;
    s.revocationReason = reason;
  }

  // Update DB if connected
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      await Session.updateOne(
        { sessionId },
        {
          $set: {
            isValid: false,
            revokedAt: now,
            revocationReason: reason,
          },
        }
      );
    } catch {
      // ignore
    }
  }

  // Invalidate Redis
  const redis = getRedis();
  if (redis) {
    try {
      await redis.del(`session:${sessionId}`);
    } catch {
      // ignore
    }
  }
}

/**
 * Revoke all active sessions for a user (e.g. on password change, account deactivation)
 */
async function revokeUserSessions(userId, reason = "SECURITY_RESET", exceptSessionId = null) {
  if (!userId) return;
  const now = new Date();
  const userIdStr = userId.toString();

  // Revoke in memory
  for (const [sId, s] of inMemorySessionStore.entries()) {
    if (s.userId === userIdStr && sId !== exceptSessionId) {
      s.isValid = false;
      s.revokedAt = now;
      s.revocationReason = reason;
    }
  }

  // Bulk update DB if connected
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const query = {
        userId,
        isValid: true,
      };
      if (exceptSessionId) {
        query.sessionId = { $ne: exceptSessionId };
      }

      await Session.updateMany(query, {
        $set: {
          isValid: false,
          revokedAt: now,
          revocationReason: reason,
        },
      });
    } catch {
      // ignore
    }
  }

  // Invalidate in Redis
  const redis = getRedis();
  if (redis) {
    try {
      // Best-effort key invalidation
      const keys = await redis.keys("session:*");
      for (const k of keys) {
        const raw = await redis.get(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.userId === userIdStr && parsed.sessionId !== exceptSessionId) {
            await redis.del(k);
          }
        }
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Fetch all active sessions for a user (Profile & Security View)
 */
async function getUserSessions(userId, currentSessionId = null) {
  if (!userId) return [];
  const now = new Date();
  const userIdStr = userId.toString();

  let sessions = [];

  // Fetch from DB if connected
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const docs = await Session.find({
        userId,
        isValid: true,
        absoluteExpiresAt: { $gt: now },
      })
        .sort({ lastActivityAt: -1 })
        .lean();
      sessions = docs;
    } catch {
      // fallback
    }
  }

  // If DB returned none or is not connected, check memory store
  if (sessions.length === 0) {
    for (const s of inMemorySessionStore.values()) {
      if (s.userId === userIdStr && s.isValid && new Date(s.absoluteExpiresAt) > now) {
        sessions.push(s);
      }
    }
  }

  return sessions.map((doc) => {
    const isCurrent = currentSessionId ? doc.sessionId === currentSessionId : false;
    return {
      sessionId: doc.sessionId,
      deviceType: doc.deviceType || "desktop",
      userAgent: doc.userAgent || "Unknown Browser",
      ipAddress: doc.ipAddress || "Unknown IP",
      createdAt: doc.createdAt,
      lastActivityAt: doc.lastActivityAt,
      absoluteExpiresAt: doc.absoluteExpiresAt,
      isCurrent,
    };
  });
}

module.exports = {
  ROLE_POLICIES,
  getPolicyForRole,
  createSession,
  validateSession,
  revokeSession,
  revokeUserSessions,
  getUserSessions,
};
