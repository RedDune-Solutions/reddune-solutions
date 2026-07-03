import "server-only";
import { getDb } from "./client";
import type { PortalSandbox } from "@/types/portal";

const COLLECTION = "portal_sandboxes";

export async function insertSandbox(sandbox: PortalSandbox): Promise<void> {
  const db = await getDb();
  await db.collection<PortalSandbox>(COLLECTION).insertOne({ ...sandbox });
}

/** Sandbox pela sua capability (id). null = não existe. */
export async function getSandboxById(id: string): Promise<PortalSandbox | null> {
  const db = await getDb();
  return db.collection<PortalSandbox>(COLLECTION).findOne({ id }, { projection: { _id: 0 } });
}

export async function getSandboxesByProjeto(projetoId: string): Promise<PortalSandbox[]> {
  const db = await getDb();
  return db
    .collection<PortalSandbox>(COLLECTION)
    .find({ projetoId }, { projection: { _id: 0 } })
    .sort({ criadoEm: -1 })
    .toArray();
}

export async function deleteSandbox(id: string): Promise<boolean> {
  const db = await getDb();
  const r = await db.collection<PortalSandbox>(COLLECTION).deleteOne({ id });
  return r.deletedCount > 0;
}

/** Apaga TODOS os sandboxes de um projeto (usado ao apagar o projeto). */
export async function deleteSandboxesByProjeto(projetoId: string): Promise<void> {
  const db = await getDb();
  await db.collection<PortalSandbox>(COLLECTION).deleteMany({ projetoId });
}
