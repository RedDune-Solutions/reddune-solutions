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
  return items.map(toPublic);
}

export async function getTarefaById(id: string): Promise<TarefaPublic | null> {
  const db = await getDb();
  const item = await db
    .collection<Tarefa>(COLLECTION)
    .findOne({ id }, { projection: { _id: 0 } });
  return item ? toPublic(item) : null;
}

export async function replaceTarefas(items: Tarefa[]): Promise<SyncMeta> {
  const db = await getDb();
  const collection = db.collection<Tarefa>(COLLECTION);

  await collection.deleteMany({});
  if (items.length > 0) {
    await collection.insertMany(items);
  }

  await Promise.all([
    collection.createIndex({ id: 1 }, { unique: true }),
    collection.createIndex({ status: 1 }),
    collection.createIndex({ cliente: 1 }),
    collection.createIndex({ tipo: 1 }),
    collection.createIndex({ pasta: 1 }),
  ]);

  const updatedAt = new Date().toISOString();
  await db
    .collection(META_COLLECTION)
    .updateOne(
      { _id: META_ID as never },
      { $set: { updatedAt, count: items.length } },
      { upsert: true }
    );

  return { updatedAt, count: items.length };
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
