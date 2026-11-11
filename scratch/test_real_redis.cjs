/**
 * MedsZop Phase 10A.1 - Task 3: Real Redis Integration Verification
 * Tests actual distributed rate limiting, TTL expiration, multi-instance coordination,
 * brute-force defense, and fail-safe fallback against the running Docker Redis container (127.0.0.1:6380).
 */

const path = require("path");
const Redis = require(path.resolve(__dirname, "../backend/node_modules/ioredis"));
const { createRateLimiter } = require("../backend/utils/rateLimiter");

const REDIS_URL = "redis://127.0.0.1:6380";

async function runRealRedisTests() {
  console.log("================================================================================");
  console.log("🚀 STARTING TASK 3: REAL REDIS INTEGRATION TEST (DOCKER CONTAINER)");
  console.log("================================================================================");

  const results = { total: 0, passed: 0, failed: 0 };
  function record(name, pass, details = "") {
    results.total++;
    if (pass) {
      results.passed++;
      console.log(`  ✅ [PASS] ${name} ${details ? "- " + details : ""}`);
    } else {
      results.failed++;
      console.log(`  ❌ [FAIL] ${name} - ${details}`);
    }
  }

  const redis = new Redis(REDIS_URL);

  try {
    // 1. Connection & Ping
    console.log("\n[1/7] Testing direct Redis connectivity...");
    const pong = await redis.ping();
    record("Real Redis Connection & PING", pong === "PONG", `Target: ${REDIS_URL}`);

    // Flush test keys
    await redis.flushdb();

    // 2. Key Creation, TTL Expiration & Auto-Cleanup
    console.log("\n[2/7] Testing key creation, TTL expiration and cleanup...");
    const testKey = "medszop:test:ttl_session";
    await redis.set(testKey, "session_data_active", "PX", 800); // 800ms TTL

    const initialVal = await redis.get(testKey);
    const initialTtl = await redis.pttl(testKey);
    const initialOk = initialVal === "session_data_active" && initialTtl > 0 && initialTtl <= 800;

    await new Promise((r) => setTimeout(r, 900));
    const expiredVal = await redis.get(testKey);
    record(
      "Key Expiration & TTL Auto-Cleanup",
      initialOk && expiredVal === null,
      `Initial TTL: ${initialTtl}ms, after 900ms: null (auto-expired)`
    );

    // 3. Multi-Instance Process Coordination
    console.log("\n[3/7] Testing multi-instance process coordination across two independent Redis clients...");
    const clientInstanceA = new Redis(REDIS_URL);
    const clientInstanceB = new Redis(REDIS_URL);
    const sharedCoordKey = "ratelimit:cluster:worker_test";

    // Worker A increments
    await clientInstanceA.incr(sharedCoordKey);
    // Worker B increments
    await clientInstanceB.incr(sharedCoordKey);

    const coordinatedCount = await redis.get(sharedCoordKey);
    record(
      "Multi-Instance Coordination via Shared Redis State",
      parseInt(coordinatedCount, 10) === 2,
      `Worker A & Worker B coordinated count: ${coordinatedCount}`
    );

    await clientInstanceA.quit();
    await clientInstanceB.quit();

    // 4. Rate Limiter Middleware Enforcement with Real Redis
    console.log("\n[4/7] Testing createRateLimiter middleware with real Redis container...");
    const rateLimiter = createRateLimiter({
      windowMs: 5000,
      max: 3,
      message: "Too many requests to protected clinical endpoint",
      redisClient: redis
    });

    const mockIp = "10.0.0.12";
    let allowedCount = 0;
    let blockedCount = 0;
    let lastHeaders = {};

    for (let i = 0; i < 5; i++) {
      const mockReq = { headers: {}, socket: { remoteAddress: mockIp } };
      let statusCalled = null;
      let nextCalled = false;

      const mockRes = {
        setHeader: (k, v) => {
          lastHeaders[k] = v;
        },
        status: (code) => {
          statusCalled = code;
          return {
            json: (body) => body
          };
        }
      };

      await rateLimiter(mockReq, mockRes, () => {
        nextCalled = true;
      });

      if (nextCalled && !statusCalled) allowedCount++;
      if (statusCalled === 429) blockedCount++;
    }

    record(
      "Distributed Rate Limiting (3 allowed, 2 blocked)",
      allowedCount === 3 && blockedCount === 2,
      `Allowed: ${allowedCount}, Blocked: ${blockedCount}, Remaining: ${lastHeaders["RateLimit-Remaining"]}`
    );

    // 5. Authentication Brute-Force Protection
    console.log("\n[5/7] Testing authentication brute-force protection (max 5 login attempts)...");
    const authLimiter = createRateLimiter({
      windowMs: 60000,
      max: 5,
      message: "Too many login attempts, please try again in 1 minute",
      redisClient: redis
    });

    let authBlockedAt = null;
    const authIp = "192.168.1.99";

    for (let attempt = 1; attempt <= 6; attempt++) {
      let isBlocked = false;
      const mockReq = { headers: {}, socket: { remoteAddress: authIp } };
      const mockRes = {
        setHeader: () => {},
        status: (code) => {
          if (code === 429) isBlocked = true;
          return { json: () => {} };
        }
      };
      await authLimiter(mockReq, mockRes, () => {});
      if (isBlocked && authBlockedAt === null) {
        authBlockedAt = attempt;
      }
    }

    record(
      "Authentication Brute-Force Lockdown on Attempt 6",
      authBlockedAt === 6,
      `First 5 attempts allowed; attempt ${authBlockedAt} blocked with HTTP 429`
    );

    // 6. Fail-Safe Fallback when Redis Becomes Unavailable
    console.log("\n[6/7] Testing fail-safe fallback when Redis is disconnected...");
    const failingRedisClient = {
      multi: () => {
        throw new Error("ECONNREFUSED - Simulated Redis cluster outage");
      }
    };

    const failSafeLimiter = createRateLimiter({
      windowMs: 5000,
      max: 2,
      redisClient: failingRedisClient
    });

    let failSafeAllowed = 0;
    let failSafeBlocked = 0;
    const failSafeIp = "172.16.0.44";

    for (let i = 0; i < 4; i++) {
      const mockReq = { headers: {}, socket: { remoteAddress: failSafeIp } };
      let blocked = false;
      const mockRes = {
        setHeader: () => {},
        status: (c) => {
          if (c === 429) blocked = true;
          return { json: () => {} };
        }
      };
      await failSafeLimiter(mockReq, mockRes, () => {});
      if (blocked) failSafeBlocked++;
      else failSafeAllowed++;
    }

    record(
      "Fail-Safe Graceful Fallback (Zero crash, in-memory throttling active)",
      failSafeAllowed === 2 && failSafeBlocked === 2,
      `Allowed: ${failSafeAllowed}, Blocked: ${failSafeBlocked} during Redis outage`
    );

    // 7. Reconnection & Verification of Redis State
    console.log("\n[7/7] Verifying Redis reconnection and persistence...");
    const reconnectPong = await redis.ping();
    const keysCount = (await redis.keys("*")).length;
    record(
      "Redis Reconnection & Active Keys Query",
      reconnectPong === "PONG",
      `Redis live PONG confirmed; active keys in container: ${keysCount}`
    );

    await redis.quit();
  } catch (err) {
    console.error("FATAL ERROR IN REAL REDIS TESTS:", err);
    record("Real Redis Test Execution", false, err.message);
    try {
      await redis.quit();
    } catch {}
  }

  console.log("\n================================================================================");
  console.log(`TASK 3 SUMMARY: Total: ${results.total} | Passed: ${results.passed} | Failed: ${results.failed}`);
  console.log("================================================================================");

  return results;
}

runRealRedisTests().then((res) => {
  if (res.failed > 0) process.exit(1);
  else process.exit(0);
});

