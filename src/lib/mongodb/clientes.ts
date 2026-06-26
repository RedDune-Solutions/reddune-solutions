import "server-only";
import { getDb } from "./client";
import type { Cliente } from "@/types/cliente";

const COLLECTION = "clientes";

export async function getAllClientes(): Promise<Cliente[]> {
  const db = await getDb();
  return db
    .collection<Cliente>(COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .sort({ nome: 1 })
    .toArray();
}

export async function getClienteById(id: string): Promise<Cliente | null> {
  const db = await getDb();
  return db
    .collection<Cliente>(COLLECTION)
    .findOne({ id }, { projection: { _id: 0 } });
}

export async function upsertCliente(cliente: Cliente): Promise<void> {
  const db = await getDb();
  const col = db.collection<Cliente>(COLLECTION);
  await col.updateOne({ id: cliente.id }, { $set: cliente }, { upsert: true });
}

export async function deleteCliente(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection<Cliente>(COLLECTION).deleteOne({ id });
  return result.deletedCount > 0;
}
