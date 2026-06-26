import "server-only";
import { getDb } from "./client";

const COLL = "audit_log";

export type MutationOp = "create" | "update" | "delete";

type LogParams = {
  collection: string;
  entityId: string;
  op: MutationOp;
  userEmail: string | null;
  before?: unknown;
  after?: unknown;
};

/**
 * Regista mutação no audit_log. Nunca lança — falha de audit não pode
 * quebrar a operação principal.
 */
export async function logMutation(params: LogParams): Promise<void> {
  try {
    const db = await getDb();
    await db.collection(COLL).insertOne({
      collection: params.collection,
      entityId: params.entityId,
      op: params.op,
      userEmail: params.userEmail,
      before: params.before ?? null,
      after: params.after ?? null,
      at: new Date(),
    });
  } catch (err) {
    console.error("logMutation failed:", err);
  }
}

export type AuditEntry = {
  _id?: unknown;
  collection: string;
  entityId: string;
  op: MutationOp;
  userEmail: string | null;
  before: unknown;
  after: unknown;
  at: Date;
};

export async function getRecentAuditEntries(limit = 100): Promise<AuditEntry[]> {
  const db = await getDb();
  const docs = await db
    .collection<AuditEntry>(COLL)
    .find({})
    .sort({ at: -1 })
    .limit(limit)
    .toArray();
  return docs.map((d) => ({ ...d, _id: undefined }));
}

export async function getAuditEntriesFor(
  collection: string,
  entityId: string,
  limit = 50
): Promise<AuditEntry[]> {
  const db = await getDb();
  const docs = await db
    .collection<AuditEntry>(COLL)
    .find({ collection, entityId })
    .sort({ at: -1 })
    .limit(limit)
    .toArray();
  return docs.map((d) => ({ ...d, _id: undefined }));
}
