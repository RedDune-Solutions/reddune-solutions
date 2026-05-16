import "server-only";
import clientPromise from "./client";

const AUDIT = "auth_audit";

async function getDb() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME);
}

export type AuthEventType =
  | "magic-link-request"
  | "signin-success"
  | "signin-rejected"
  | "signout";

export async function logAuthEvent(event: {
  userId?: string | null;
  email?: string | null;
  type: AuthEventType;
  ip?: string | null;
  userAgent?: string | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    const db = await getDb();
    await db.collection(AUDIT).insertOne({
      userId: event.userId ?? null,
      email: event.email ?? null,
      type: event.type,
      ip: event.ip ?? null,
      userAgent: event.userAgent ?? null,
      details: event.details ?? {},
      at: new Date(),
    });
    await db.collection(AUDIT).createIndex({ at: -1 });
    await db.collection(AUDIT).createIndex({ email: 1, type: 1, at: -1 });
  } catch (err) {
    // Audit log failure must never break auth flow
    console.error("logAuthEvent failed:", err);
  }
}
