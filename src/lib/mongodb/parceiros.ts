import "server-only";
import clientPromise from "./client";
import type { ParceirFicha } from "@/types/cliente";

const COLLECTION = "parceiros";

async function getDb() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME);
}

export async function getAllParceiros(): Promise<ParceirFicha[]> {
  const db = await getDb();
  return db
    .collection<ParceirFicha>(COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .toArray();
}

export async function getParceiroBySlug(slug: string): Promise<ParceirFicha | null> {
  const db = await getDb();
  const all = await db
    .collection<ParceirFicha>(COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .toArray();
  const target = slug.toLowerCase();
  return (
    all.find((c) => {
      const nome = String(c.nome ?? "").toLowerCase();
      const file = String(c.sourcePath ?? "").split("/").pop()?.replace(/\.md$/, "").toLowerCase() ?? "";
      return nome === target || file === target;
    }) ?? null
  );
}

export async function replaceParceiros(
  items: ParceirFicha[]
): Promise<{ count: number; updatedAt: string }> {
  const db = await getDb();
  const col = db.collection<ParceirFicha>(COLLECTION);
  await col.deleteMany({});
  if (items.length > 0) await col.insertMany(items as ParceirFicha[]);
  await Promise.all([
    col.createIndex({ sourcePath: 1 }, { unique: true }),
    col.createIndex({ nome: 1 }),
  ]);
  return { count: items.length, updatedAt: new Date().toISOString() };
}
