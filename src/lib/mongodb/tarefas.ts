import "server-only";
import clientPromise from "./client";
import type { Tarefa, TarefaPublic, SyncMeta } from "@/types/tarefa";

const COLLECTION = "tarefas";
const META_COLLECTION = "tarefas_meta";
const META_ID = "tarefas-sync";

async function getDb() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME);
}

function toPublic({ sourcePath: _sourcePath, ...rest }: Tarefa): TarefaPublic {
  return rest;
}

export async function getAllTarefas(): Promise<TarefaPublic[]> {
  const db = await getDb();
  const items = await db
    .collection<Tarefa>(COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .toArray();
  return items.map((item) => toPublic({ ...item, origin: item.origin ?? "obsidian" }));
}

export async function getTarefaById(id: string): Promise<TarefaPublic | null> {
  const db = await getDb();
  const item = await db
    .collection<Tarefa>(COLLECTION)
    .findOne({ id }, { projection: { _id: 0 } });
  return item ? toPublic({ ...item, origin: item.origin ?? "obsidian" }) : null;
}

/**
 * Replace only Obsidian-origin tarefas. Manual entries are preserved.
 */
export async function replaceTarefas(items: Tarefa[]): Promise<SyncMeta> {
  const db = await getDb();
  const collection = db.collection<Tarefa>(COLLECTION);

  const tagged: Tarefa[] = items.map((t) => ({ ...t, origin: "obsidian" }));

  await collection.deleteMany({ $or: [{ origin: "obsidian" }, { origin: { $exists: false } }] });
  if (tagged.length > 0) {
    await collection.insertMany(tagged);
  }

  await Promise.all([
    collection.createIndex({ id: 1 }, { unique: true }),
    collection.createIndex({ status: 1 }),
    collection.createIndex({ cliente: 1 }),
    collection.createIndex({ tipo: 1 }),
    collection.createIndex({ pasta: 1 }),
    collection.createIndex({ origin: 1 }),
  ]);

  const manualCount = await collection.countDocuments({ origin: "manual" });
  const total = tagged.length + manualCount;

  const updatedAt = new Date().toISOString();
  await db
    .collection(META_COLLECTION)
    .updateOne(
      { _id: META_ID as never },
      { $set: { updatedAt, count: total } },
      { upsert: true }
    );

  return { updatedAt, count: total };
}

/**
 * Upsert a single tarefa (manual entry). Sets origin to "manual".
 */
export async function upsertTarefa(tarefa: Tarefa): Promise<void> {
  const db = await getDb();
  const collection = db.collection<Tarefa>(COLLECTION);
  await collection.updateOne(
    { id: tarefa.id },
    { $set: { ...tarefa, origin: tarefa.origin ?? "manual" } },
    { upsert: true }
  );
  await collection.createIndex({ id: 1 }, { unique: true });
}

/**
 * Update specific fields of a tarefa by id. Returns true if a doc was modified.
 */
export async function patchTarefa(
  id: string,
  patch: Partial<Tarefa>
): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection<Tarefa>(COLLECTION)
    .updateOne({ id }, { $set: patch });
  return result.matchedCount > 0;
}

export async function deleteTarefa(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection<Tarefa>(COLLECTION).deleteOne({ id });
  return result.deletedCount > 0;
}

export async function getSyncMeta(): Promise<SyncMeta | null> {
  const db = await getDb();
  const doc = await db
    .collection<SyncMeta & { _id: string }>(META_COLLECTION)
    .findOne(
      { _id: META_ID as never },
      { projection: { _id: 0, updatedAt: 1, count: 1 } }
    );
  return doc ? { updatedAt: doc.updatedAt, count: doc.count } : null;
}
