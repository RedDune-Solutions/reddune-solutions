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

// Campos volumosos que não devem ir para o snapshot (ex.: bodyMd de projeto até
// 50KB, arrays de linhas/arquivos). Guardar cópias completas por cada edição
// fazia o audit_log crescer ~100KB/gravação e retinha PII sem limite.
const HEAVY_KEYS = new Set(["bodyMd", "linhas", "arquivos", "hardware"]);
const MAX_STR = 2000;

/** Enxuga o snapshot: omite campos pesados e trunca strings longas. */
function sanitizeSnapshot(value: unknown): unknown {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (HEAVY_KEYS.has(k)) {
      out[k] = v == null ? v : "[omitido]";
    } else if (typeof v === "string" && v.length > MAX_STR) {
      out[k] = v.slice(0, MAX_STR) + "…[truncado]";
    } else {
      out[k] = v;
    }
  }
  return out;
}

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
      before: sanitizeSnapshot(params.before ?? null),
      after: sanitizeSnapshot(params.after ?? null),
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
