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

/**
 * Liga o lead a um cliente já criado e marca-o como "ganho".
 * Patch apenas do próprio lead — não toca noutras colecções.
 */
export async function setLeadCliente(
  id: string,
  clienteId: string
): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection<Lead>(COLLECTION).updateOne(
    { id },
    {
      $set: {
        clienteId,
        estado: "ganho",
        atualizadoEm: new Date().toISOString(),
      },
    }
  );
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

export type LeadNovoResumo = Pick<Lead, "id" | "nome" | "subject" | "criadoEm">;

/**
 * Leads em estado "novo" mais recentes, SÓ os campos necessários para o feed
 * do sino. Usa o índice { estado, criadoEm } — evita trazer a colecção inteira
 * (com mensagem + IP) a cada poll de 60s por aba, como fazia getAllLeads().
 */
export async function getLeadsNovosRecentes(
  limit = 8
): Promise<LeadNovoResumo[]> {
  const db = await getDb();
  return db
    .collection<Lead>(COLLECTION)
    .find(
      { estado: "novo" },
      { projection: { _id: 0, id: 1, nome: 1, subject: 1, criadoEm: 1 } }
    )
    .sort({ criadoEm: -1 })
    .limit(limit)
    .toArray() as Promise<LeadNovoResumo[]>;
}
