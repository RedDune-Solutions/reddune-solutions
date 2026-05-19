import "server-only";
import clientPromise from "./client";

export interface ServicoCategoria {
  id: string;
  slug: string;
  label: string;
  ordem: number;
  criadoEm: string;
}

const COLLECTION = "servico_categorias";

async function getDb() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME);
}

export async function getAllServicoCategorias(): Promise<ServicoCategoria[]> {
  const db = await getDb();
  return db
    .collection<ServicoCategoria>(COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .sort({ ordem: 1 })
    .toArray();
}

export async function upsertServicoCategoria(c: ServicoCategoria): Promise<void> {
  const db = await getDb();
  await db
    .collection<ServicoCategoria>(COLLECTION)
    .updateOne({ id: c.id }, { $set: c }, { upsert: true });
}

export async function deleteServicoCategoria(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection<ServicoCategoria>(COLLECTION)
    .deleteOne({ id });
  return result.deletedCount > 0;
}
