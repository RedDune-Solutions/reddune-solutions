import "server-only";
import { getDb } from "./client";
import type { Tarefa } from "@/types/tarefa";

const COLLECTION = "tarefas";

export async function getTarefasByProjeto(projetoId: string): Promise<Tarefa[]> {
  const db = await getDb();
  return db
    .collection<Tarefa>(COLLECTION)
    .find({ projetoId }, { projection: { _id: 0 } })
    .sort({ ordem: 1 })
    .toArray();
}

export async function getAllTarefas(): Promise<Tarefa[]> {
  const db = await getDb();
  return db
    .collection<Tarefa>(COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .sort({ ordem: 1 })
    .toArray();
}

/** Lê apenas o projetoId de uma tarefa (para revalidar a página do projeto). */
export async function getTarefaProjetoId(id: string): Promise<string | null> {
  const db = await getDb();
  const doc = await db
    .collection<Tarefa>(COLLECTION)
    .findOne({ id }, { projection: { _id: 0, projetoId: 1 } });
  return doc?.projetoId ?? null;
}

export async function upsertTarefa(tarefa: Tarefa): Promise<void> {
  const db = await getDb();
  const col = db.collection<Tarefa>(COLLECTION);
  await col.updateOne({ id: tarefa.id }, { $set: tarefa }, { upsert: true });
}

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

export async function deleteTarefasByProjeto(projetoId: string): Promise<void> {
  const db = await getDb();
  await db.collection<Tarefa>(COLLECTION).deleteMany({ projetoId });
}
