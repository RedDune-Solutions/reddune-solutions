import "server-only";
import clientPromise from "./client";
import type { Nota } from "@/types/nota";

const COLLECTION = "notas";

async function getDb() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME);
}

export async function getAllNotas(): Promise<Nota[]> {
  const db = await getDb();
  return db
    .collection<Nota>(COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .sort({ atualizadoEm: -1 })
    .toArray();
}

export async function upsertNota(nota: Nota): Promise<void> {
  const db = await getDb();
  const col = db.collection<Nota>(COLLECTION);
  await col.updateOne({ id: nota.id }, { $set: nota }, { upsert: true });
  await col.createIndex({ id: 1 }, { unique: true });
}

export async function deleteNota(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection<Nota>(COLLECTION).deleteOne({ id });
  return result.deletedCount > 0;
}
