import "server-only";
import { redisRateLimit } from "./rate-limit-redis";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}

// Shared rate limit, consistent across serverless instances. Tries Upstash
// (if configured) -> the app's own MongoDB -> the per-instance in-memory
// limiter as last resort. Node runtime only (Mongo driver); the Edge
// middleware keeps its own limiter.
export async function rateLimitDistributed(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redis = await redisRateLimit(key, limit, windowMs);
  if (redis) return redis;
  const { mongoRateLimit } = await import("./rate-limit-mongo");
  const mongo = await mongoRateLimit(key, limit, windowMs);
  if (mongo) return mongo;
  return rateLimit(key, limit, windowMs);
}

export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
