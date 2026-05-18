import "server-only";
import clientPromise from "./client";

let initialised = false;
let inFlight: Promise<void> | null = null;

async function doInit(): Promise<void> {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME);

  await Promise.all([
    db.collection("projetos").createIndex({ id: 1 }, { unique: true }),
    db.collection("projetos").createIndex({ clienteId: 1 }),
    db.collection("projetos").createIndex({ status: 1 }),

    db.collection("tarefas").createIndex({ id: 1 }, { unique: true }),
    db.collection("tarefas").createIndex({ projetoId: 1 }),

    db.collection("clientes").createIndex({ id: 1 }, { unique: true }),

    db.collection("pagamentos").createIndex({ id: 1 }, { unique: true }),
    db.collection("pagamentos").createIndex({ projetoId: 1 }),
    db.collection("pagamentos").createIndex({ clienteId: 1 }),

    db.collection("servicos").createIndex({ id: 1 }, { unique: true }),
    db.collection("servicos").createIndex({ slug: 1, ordem: 1 }),

    db.collection("tarefa_templates").createIndex({ id: 1 }, { unique: true }),
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
