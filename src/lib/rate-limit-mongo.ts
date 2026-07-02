import "server-only";
import { getClient } from "./mongodb/client";
import type { RateLimitResult } from "./rate-limit";

// Distributed fixed-window rate limiter backed by the app's existing MongoDB.
// Node runtime only (the Mongo driver does not run in Edge middleware) — the
// middleware keeps its in-memory/Upstash limiter; API routes use this.
//
// Returns null on any error so callers fall back to the in-memory limiter.

const COLLECTION = "rate_limits";

let indexEnsured: Promise<void> | null = null;

async function getCollection() {
  const client = await getClient();
  const col = client
    .db(process.env.MONGODB_DB_NAME)
    .collection<{ _id: string; count: number; resetAt: Date }>(COLLECTION);

  // TTL index purges expired windows automatically. Created once per process.
  if (!indexEnsured) {
    indexEnsured = col
      .createIndex({ resetAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 })
      .then(() => undefined)
      .catch(() => {
        indexEnsured = null;
      });
  }
  return col;
}

export async function mongoRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult | null> {
  try {
    const col = await getCollection();
    const now = new Date();
    const newReset = new Date(now.getTime() + windowMs);

    // Atomic upsert with an aggregation pipeline: reset the counter when the
    // window expired, otherwise increment within the current window.
    const doc = await col.findOneAndUpdate(
      { _id: key },
      [
        {
          $set: {
            count: {
              $cond: [
                { $lte: [{ $ifNull: ["$resetAt", now] }, now] },
                1,
                { $add: [{ $ifNull: ["$count", 0] }, 1] },
              ],
            },
            resetAt: {
              $cond: [
                { $lte: [{ $ifNull: ["$resetAt", now] }, now] },
                newReset,
                { $ifNull: ["$resetAt", newReset] },
              ],
            },
          },
        },
      ],
      { upsert: true, returnDocument: "after" }
    );

    if (!doc) return null;

    const resetAt = doc.resetAt.getTime();
    if (doc.count > limit) return { allowed: false, remaining: 0, resetAt };
    return {
      allowed: true,
      remaining: Math.max(0, limit - doc.count),
      resetAt,
    };
  } catch (e) {
    console.warn("Mongo rate limit unavailable, falling back:", e);
    return null;
  }
}
