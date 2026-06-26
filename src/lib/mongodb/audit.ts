import "server-only";
import { getDb } from "./client";

const AUDIT = "auth_audit";

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
    // Indexes criados em ensureIndexes() — não aqui.
  } catch (err) {
    // Audit log failure must never break auth flow
    console.error("logAuthEvent failed:", err);
  }
}
