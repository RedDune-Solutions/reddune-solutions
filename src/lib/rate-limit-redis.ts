// Distributed fixed-window rate limiter backed by Upstash Redis over its REST
// API. Edge-runtime safe (uses fetch only, no SDK, no Node APIs).
//
// Returns null when Upstash is not configured (env vars missing) or on any
// error, so callers transparently fall back to the in-memory limiter. Set
// UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable.

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export type RedisRateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} | null;

export async function redisRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RedisRateLimitResult> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;

  const windowSec = Math.ceil(windowMs / 1000);

  try {
    // Atomic pipeline: increment the counter, set the TTL only on the first hit
    // of the window (EXPIRE ... NX), and read the remaining TTL.
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, windowSec, "NX"],
        ["PTTL", key],
      ]),
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { result: unknown }[];
    const count = Number(data[0]?.result ?? 0);
    const pttl = Number(data[2]?.result ?? windowMs);
    const resetAt = Date.now() + (pttl > 0 ? pttl : windowMs);

    if (count > limit) return { allowed: false, remaining: 0, resetAt };
    return { allowed: true, remaining: Math.max(0, limit - count), resetAt };
  } catch (e) {
    console.warn("Upstash rate limit unavailable, falling back:", e);
    return null;
  }
}
