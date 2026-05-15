import "server-only";
import clientPromise from "./client";
import type { ClienteFicha } from "@/types/cliente";

const COLLECTION = "clientes";

async function getDb() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME);
}

export async function getAllClientes(): Promise<ClienteFicha[]> {
  const db = await getDb();
  return db
    .collection<ClienteFicha>(COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .toArray();
}

export async function replaceClientes(
  items: ClienteFicha[]
): Promise<{ count: number; updatedAt: string }> {
  const db = await getDb();
  const col = db.collection<ClienteFicha>(COLLECTION);
  await col.deleteMany({});
  if (items.length > 0) await col.insertMany(items as ClienteFicha[]);
  await Promise.all([
    col.createIndex({ sourcePath: 1 }, { unique: true }),
    col.createIndex({ nome: 1 }),
  ]);
  return { count: items.length, updatedAt: new Date().toISOString() };
}
