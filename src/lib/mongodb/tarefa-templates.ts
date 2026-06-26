import "server-only";
import { getDb } from "./client";
import type { TarefaTemplate } from "@/types/tarefa-template";

const COLLECTION = "tarefa_templates";

export async function getAllTarefaTemplates(): Promise<TarefaTemplate[]> {
  const db = await getDb();
  return db
    .collection<TarefaTemplate>(COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .sort({ nome: 1 })
    .toArray();
}

export async function getTarefaTemplateById(id: string): Promise<TarefaTemplate | null> {
  const db = await getDb();
  return db
    .collection<TarefaTemplate>(COLLECTION)
    .findOne({ id }, { projection: { _id: 0 } });
}

export async function upsertTarefaTemplate(t: TarefaTemplate): Promise<void> {
  const db = await getDb();
  const col = db.collection<TarefaTemplate>(COLLECTION);
  await col.updateOne({ id: t.id }, { $set: t }, { upsert: true });
}

export async function deleteTarefaTemplate(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection<TarefaTemplate>(COLLECTION).deleteOne({ id });
  return result.deletedCount > 0;
}
