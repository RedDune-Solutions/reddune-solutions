import "server-only";
import { getDb } from "./client";
import type { Projeto, ProjetoPortal } from "@/types/projeto";
import type { PortalComentario } from "@/types/portal";

const COMENTARIOS = "portal_comentarios";

/** Resolve um token (já hashed) num projecto com portal activo. */
export async function getProjetoByPortalTokenHash(tokenHash: string): Promise<Projeto | null> {
  const db = await getDb();
  return db.collection<Projeto>("projetos").findOne(
    { "portal.tokenHash": tokenHash, "portal.revogadoEm": null },
    { projection: { _id: 0 } }
  );
}

export async function setProjetoPortal(projetoId: string, portal: ProjetoPortal): Promise<boolean> {
  const db = await getDb();
  const r = await db.collection<Projeto>("projetos").updateOne({ id: projetoId }, { $set: { portal } });
  return r.matchedCount > 0;
}

export async function revokeProjetoPortal(projetoId: string): Promise<boolean> {
  const db = await getDb();
  const r = await db
    .collection("projetos")
    .updateOne(
      { id: projetoId, portal: { $ne: null } },
      { $set: { "portal.revogadoEm": new Date().toISOString() } }
    );
  return r.matchedCount > 0;
}

export async function insertComentario(c: PortalComentario): Promise<void> {
  const db = await getDb();
  await db.collection<PortalComentario>(COMENTARIOS).insertOne({ ...c });
}

export async function getComentariosByProjeto(projetoId: string): Promise<PortalComentario[]> {
  const db = await getDb();
  return db
    .collection<PortalComentario>(COMENTARIOS)
    .find({ projetoId }, { projection: { _id: 0 } })
    .sort({ criadoEm: -1 })
    .limit(200)
    .toArray();
}

export async function marcarComentarioLido(id: string): Promise<boolean> {
  const db = await getDb();
  const r = await db
    .collection<PortalComentario>(COMENTARIOS)
    .updateOne({ id, lidoEm: null }, { $set: { lidoEm: new Date().toISOString() } });
  return r.matchedCount > 0;
}

/** Nº de comentários nas últimas 24h por projecto (tecto anti-flood). */
export async function countComentariosRecentes(projetoId: string): Promise<number> {
  const db = await getDb();
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  return db
    .collection<PortalComentario>(COMENTARIOS)
    .countDocuments({ projetoId, criadoEm: { $gte: desde } });
}
