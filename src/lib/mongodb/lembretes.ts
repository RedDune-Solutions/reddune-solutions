import "server-only";
import { getDb } from "./client";
import type { Lembrete } from "@/types/lembrete";

const COLLECTION = "lembretes";

export async function getLembretesByProjeto(projetoId: string): Promise<Lembrete[]> {
  const db = await getDb();
  return db
    .collection<Lembrete>(COLLECTION)
    .find({ projetoId }, { projection: { _id: 0 } })
    .sort({ ordem: 1 })
    .toArray();
}

export async function getAllLembretes(): Promise<Lembrete[]> {
  const db = await getDb();
  return db
    .collection<Lembrete>(COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .sort({ ordem: 1 })
    .toArray();
}

/** Lê apenas o projetoId de um lembrete (para revalidar a página do projeto). */
export async function getLembreteProjetoId(id: string): Promise<string | null> {
  const db = await getDb();
  const doc = await db
    .collection<Lembrete>(COLLECTION)
    .findOne({ id }, { projection: { _id: 0, projetoId: 1 } });
  return doc?.projetoId ?? null;
}

export async function upsertLembrete(lembrete: Lembrete): Promise<void> {
  const db = await getDb();
  const col = db.collection<Lembrete>(COLLECTION);
  await col.updateOne({ id: lembrete.id }, { $set: lembrete }, { upsert: true });
}

export async function patchLembrete(
  id: string,
  patch: Partial<Lembrete>
): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection<Lembrete>(COLLECTION)
    .updateOne({ id }, { $set: patch });
  return result.matchedCount > 0;
}

export async function deleteLembrete(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection<Lembrete>(COLLECTION).deleteOne({ id });
  return result.deletedCount > 0;
}

export async function deleteLembretesByProjeto(projetoId: string): Promise<void> {
  const db = await getDb();
  await db.collection<Lembrete>(COLLECTION).deleteMany({ projetoId });
}
