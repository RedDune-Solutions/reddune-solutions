import "server-only";
import clientPromise from "./client";
import type { Projeto } from "@/types/projeto";

const COLLECTION = "projetos";

async function getDb() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME);
}

export async function getAllProjetos(): Promise<Projeto[]> {
  const db = await getDb();
  return db
    .collection<Projeto>(COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .toArray();
}

export async function getProjetoById(id: string): Promise<Projeto | null> {
  const db = await getDb();
  return db
    .collection<Projeto>(COLLECTION)
    .findOne({ id }, { projection: { _id: 0 } });
}

export async function upsertProjeto(projeto: Projeto): Promise<void> {
  const db = await getDb();
  const col = db.collection<Projeto>(COLLECTION);
  await col.updateOne({ id: projeto.id }, { $set: projeto }, { upsert: true });
  await col.createIndex({ id: 1 }, { unique: true });
}

export async function patchProjeto(
  id: string,
  patch: Partial<Projeto>
): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection<Projeto>(COLLECTION)
    .updateOne({ id }, { $set: patch });
  return result.matchedCount > 0;
}

export async function deleteProjeto(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection<Projeto>(COLLECTION).deleteOne({ id });
  return result.deletedCount > 0;
}
