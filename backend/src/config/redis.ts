import { Redis } from "ioredis";
import { env } from "./env.js";

let redisClient: Redis | null = null;
let isConnected = false;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          console.warn("[Redis] Connection unavailable; continuing with degraded async caching/job fallback.");
          return null; // Stop retrying automatically to avoid blocking
        }
        return Math.min(times * 200, 1000);
      }
    });

    redisClient.on("connect", () => {
      isConnected = true;
      console.log("[Redis] Connected successfully to Redis server.");
    });

    redisClient.on("error", (err) => {
      isConnected = false;
      // Do not crash server on Redis disconnect
      // console.warn(`[Redis] Notice: ${err.message}`);
    });
  }

  return redisClient;
}

export function getRedisStatus(): { connected: boolean; url: string } {
  return {
    connected: isConnected,
    url: env.REDIS_URL.replace(/:\/\/[^@]*@/, "://***@") // Redact password
  };
}
