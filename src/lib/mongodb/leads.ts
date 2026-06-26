import "server-only";
import { getDb } from "./client";
import type { Lead, LeadEstado } from "@/types/lead";

const COLLECTION = "leads";

export async function getAllLeads(): Promise<Lead[]> {
  const db = await getDb();
  return db
    .collection<Lead>(COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .sort({ criadoEm: -1 })
    .toArray();
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const db = await getDb();
  return db.collection<Lead>(COLLECTION).findOne({ id }, { projection: { _id: 0 } });
}

/** Captura inicial (do formulário público). insertOne — não mascara duplicados. */
export async function createLead(lead: Lead): Promise<void> {
  const db = await getDb();
  await db.collection<Lead>(COLLECTION).insertOne(lead);
}

export async function upsertLead(lead: Lead): Promise<void> {
  const db = await getDb();
  await db
    .collection<Lead>(COLLECTION)
    .updateOne({ id: lead.id }, { $set: lead }, { upsert: true });
}

export async function updateLeadEstado(
  id: string,
  estado: LeadEstado
): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection<Lead>(COLLECTION)
    .updateOne({ id }, { $set: { estado, atualizadoEm: new Date().toISOString() } });
  return result.matchedCount > 0;
}

export async function deleteLead(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection<Lead>(COLLECTION).deleteOne({ id });
  return result.deletedCount > 0;
}

export async function countLeadsNovos(): Promise<number> {
  const db = await getDb();
  return db.collection<Lead>(COLLECTION).countDocuments({ estado: "novo" });
}
