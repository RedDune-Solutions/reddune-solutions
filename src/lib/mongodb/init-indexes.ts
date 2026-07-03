import "server-only";
import { getClient } from "./client";

let initialised = false;
let inFlight: Promise<void> | null = null;

async function doInit(): Promise<void> {
  const client = await getClient();
  const db = client.db(process.env.MONGODB_DB_NAME);

  await Promise.all([
    db.collection("projetos").createIndex({ id: 1 }, { unique: true }),
    db.collection("projetos").createIndex({ clienteId: 1 }),
    db.collection("projetos").createIndex({ status: 1 }),

    db.collection("projetos").createIndex(
      { "portal.tokenHash": 1 },
      { unique: true, partialFilterExpression: { "portal.tokenHash": { $type: "string" } } }
    ),

    db.collection("portal_comentarios").createIndex({ id: 1 }, { unique: true }),
    db.collection("portal_comentarios").createIndex({ projetoId: 1, criadoEm: -1 }),

    db.collection("portal_sandboxes").createIndex({ id: 1 }, { unique: true }),
    db.collection("portal_sandboxes").createIndex({ projetoId: 1, criadoEm: -1 }),

    db.collection("tarefas").createIndex({ id: 1 }, { unique: true }),
    db.collection("tarefas").createIndex({ projetoId: 1 }),

    db.collection("clientes").createIndex({ id: 1 }, { unique: true }),
    db.collection("clientes").createIndex(
      { email: 1 },
      { unique: true, partialFilterExpression: { email: { $type: "string" } } }
    ),
    db.collection("clientes").createIndex(
      { nif: 1 },
      { unique: true, partialFilterExpression: { nif: { $type: "string" } } }
    ),

    db.collection("pagamentos").createIndex({ id: 1 }, { unique: true }),
    db.collection("pagamentos").createIndex({ projetoId: 1 }),
    db.collection("pagamentos").createIndex({ clienteId: 1 }),

    db.collection("servicos").createIndex({ id: 1 }, { unique: true }),
    db.collection("servicos").createIndex({ slug: 1, ordem: 1 }),

    db.collection("tarefa_templates").createIndex({ id: 1 }, { unique: true }),

    db.collection("projeto_tipos_custom").createIndex({ id: 1 }, { unique: true }),
    db.collection("projeto_tipos_custom").createIndex({ slug: 1 }, { unique: true }),

    db.collection("auth_audit").createIndex({ at: -1 }),
    db.collection("auth_audit").createIndex({ email: 1, type: 1, at: -1 }),

    db.collection("audit_log").createIndex({ at: -1 }),
    db.collection("audit_log").createIndex({ collection: 1, entityId: 1, at: -1 }),
    db.collection("audit_log").createIndex({ userEmail: 1, at: -1 }),
    // Retenção do audit_log: 2 anos (RGPD — limitação da conservação). Purga
    // automática de entradas antigas; snapshots já são enxutos (ver mutation-audit).
    db.collection("audit_log").createIndex(
      { at: 1 },
      { expireAfterSeconds: 2 * 365 * 24 * 60 * 60, name: "audit_ttl" }
    ),

    db.collection("leads").createIndex({ id: 1 }, { unique: true }),
    db.collection("leads").createIndex({ estado: 1, criadoEm: -1 }),
    db.collection("leads").createIndex({ criadoEm: -1 }),

    db.collection("push_subscriptions").createIndex({ endpoint: 1 }, { unique: true }),

    db.collection("blocked_ips").createIndex({ ip: 1 }, { unique: true }),

    db.collection("settings").createIndex({ id: 1 }, { unique: true }),
  ]);
}

export async function ensureIndexes(): Promise<void> {
  if (initialised) return;
  if (inFlight) return inFlight;
  inFlight = doInit()
    .then(() => {
      initialised = true;
    })
    .catch((e) => {
      console.error("ensureIndexes failed", e);
      // não bloqueia — próxima chamada tenta de novo
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}
