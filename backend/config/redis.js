const Redis = require("ioredis");

let redisClient = null;

function getRedisClient() {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      connectTimeout: 2500,
      lazyConnect: false,
      retryStrategy(times) {
        if (times > 3) return null; // Fall safe to in-memory store
        return Math.min(times * 150, 1000);
      }
    });

    redisClient.on("connect", () => {
      console.log(`[Redis] Connected successfully to ${redisUrl}`);
    });

    redisClient.on("error", (err) => {
      console.warn(`[Redis] Connection issue: ${err.message}`);
    });

    return redisClient;
  } catch (err) {
    console.warn(`[Redis] Failed to initialize client: ${err.message}`);
    return null;
  }
}

async function closeRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    }
    redisClient = null;
  }
}

module.exports = {
  getRedisClient,
  closeRedis
};

