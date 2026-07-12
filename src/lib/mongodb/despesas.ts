import "server-only";
import { getDb } from "./client";
import type { Despesa } from "@/types/despesa";

const COLLECTION = "despesas";

export async function getAllDespesas(): Promise<Despesa[]> {
  const db = await getDb();
  return db
    .collection<Despesa>(COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .sort({ data: -1 })
    .toArray();
}

export async function getDespesasByProjeto(projetoId: string): Promise<Despesa[]> {
  const db = await getDb();
  return db
    .collection<Despesa>(COLLECTION)
    .find({ projetoId }, { projection: { _id: 0 } })
    .sort({ data: -1 })
    .toArray();
}

export async function upsertDespesa(d: Despesa): Promise<void> {
  const db = await getDb();
  const col = db.collection<Despesa>(COLLECTION);
  // Não reescrever `criadoEm` em updates — só no insert via $setOnInsert.
  const { criadoEm, ...updateDoc } = d;
  await col.updateOne(
    { id: d.id },
    { $set: updateDoc, $setOnInsert: { criadoEm } },
    { upsert: true }
  );
}

export async function deleteDespesa(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection<Despesa>(COLLECTION).deleteOne({ id });
  return result.deletedCount > 0;
}
