import "server-only";
import clientPromise from "./client";
import type { Pagamento } from "@/types/pagamento";

const COLLECTION = "pagamentos";

async function getDb() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME);
}

export async function getPagamentosByProjeto(projetoId: string): Promise<Pagamento[]> {
  const db = await getDb();
  return db
    .collection<Pagamento>(COLLECTION)
    .find({ projetoId }, { projection: { _id: 0 } })
    .sort({ data: -1 })
    .toArray();
}

export async function getPagamentosByCliente(clienteId: string): Promise<Pagamento[]> {
  const db = await getDb();
  return db
    .collection<Pagamento>(COLLECTION)
    .find({ clienteId }, { projection: { _id: 0 } })
    .sort({ data: -1 })
    .toArray();
}

export async function getAllPagamentos(): Promise<Pagamento[]> {
  const db = await getDb();
  return db
    .collection<Pagamento>(COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .sort({ data: -1 })
    .toArray();
}

export async function upsertPagamento(p: Pagamento): Promise<void> {
  const db = await getDb();
  const col = db.collection<Pagamento>(COLLECTION);
  await col.updateOne({ id: p.id }, { $set: p }, { upsert: true });
}

export async function deletePagamento(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection<Pagamento>(COLLECTION).deleteOne({ id });
  return result.deletedCount > 0;
}
