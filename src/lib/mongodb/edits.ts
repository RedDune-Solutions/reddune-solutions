import "server-only";
import { ObjectId } from "mongodb";
import clientPromise from "./client";

const COLLECTION = "tarefa_edits";

async function getDb() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME);
}

export type EditField = "status" | "proximaAccao";

export type PendingEdit = {
  _id?: ObjectId;
  tarefaId: string;
  sourcePath: string;
  field: EditField;
  newValue: string;
  requestedBy: string | null;
  requestedByEmail: string | null;
  requestedAt: Date;
  appliedAt: Date | null;
};

export async function queueEdit(input: Omit<PendingEdit, "_id" | "requestedAt" | "appliedAt">): Promise<string> {
  const db = await getDb();
  const result = await db.collection(COLLECTION).insertOne({
    ...input,
    requestedAt: new Date(),
    appliedAt: null,
  });
  await db.collection(COLLECTION).createIndex({ appliedAt: 1 });
  await db.collection(COLLECTION).createIndex({ tarefaId: 1, requestedAt: -1 });
  return result.insertedId.toString();
}

export async function getPendingEdits(): Promise<PendingEdit[]> {
  const db = await getDb();
  return db
    .collection<PendingEdit>(COLLECTION)
    .find({ appliedAt: null })
    .sort({ requestedAt: 1 })
    .toArray();
}

export async function getPendingEditsByTarefa(tarefaId: string): Promise<PendingEdit[]> {
  const db = await getDb();
  return db
    .collection<PendingEdit>(COLLECTION)
    .find({ tarefaId, appliedAt: null })
    .sort({ requestedAt: 1 })
    .toArray();
}

export async function markEditApplied(id: string): Promise<void> {
  const db = await getDb();
  await db.collection(COLLECTION).updateOne(
    { _id: new ObjectId(id) },
    { $set: { appliedAt: new Date() } }
  );
}
