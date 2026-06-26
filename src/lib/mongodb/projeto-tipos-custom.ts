import "server-only";
import { getDb } from "./client";
import type { ServicoSlug } from "@/types/servico";

export interface ProjetoTipoCustom {
  id: string;
  slug: string;
  label: string;
  categoria: ServicoSlug;
  criadoEm: string;
}

const COLLECTION = "projeto_tipos_custom";

export async function getAllProjetoTiposCustom(): Promise<ProjetoTipoCustom[]> {
  const db = await getDb();
  return db
    .collection<ProjetoTipoCustom>(COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .sort({ categoria: 1, label: 1 })
    .toArray();
}

export async function upsertProjetoTipoCustom(t: ProjetoTipoCustom): Promise<void> {
  const db = await getDb();
  await db
    .collection<ProjetoTipoCustom>(COLLECTION)
    .updateOne({ id: t.id }, { $set: t }, { upsert: true });
}

export async function deleteProjetoTipoCustom(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection<ProjetoTipoCustom>(COLLECTION).deleteOne({ id });
  return result.deletedCount > 0;
}
