import "server-only";
import { getDb } from "./client";
import type { Projeto, ProjetoArquivo } from "@/types/projeto";

const COLLECTION = "projetos";

export async function getAllProjetos(): Promise<Projeto[]> {
  const db = await getDb();
  return db
    .collection<Projeto>(COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .toArray();
}

export async function getProjetoById(id: string): Promise<Projeto | null> {
  const db = await getDb();
  return db
    .collection<Projeto>(COLLECTION)
    .findOne({ id }, { projection: { _id: 0 } });
}

/** Projectos de um cliente. Usa o índice projetos.clienteId (antes filtrava em JS após getAllProjetos). */
export async function getProjetosByCliente(clienteId: string): Promise<Projeto[]> {
  const db = await getDb();
  return db
    .collection<Projeto>(COLLECTION)
    .find({ clienteId }, { projection: { _id: 0 } })
    .toArray();
}

export type ProjetoResumo = Pick<
  Projeto,
  "id" | "status" | "valorEstimado" | "prazo" | "dataFechado" | "clienteId"
>;

/**
 * Só os campos leves necessários para contagens/listas. Evita puxar bodyMd
 * (até 50KB), linhas e arquivos de TODOS os projectos só para contar badges.
 */
export async function getProjetosResumo(): Promise<ProjetoResumo[]> {
  const db = await getDb();
  return db
    .collection<Projeto>(COLLECTION)
    .find(
      {},
      {
        projection: {
          _id: 0,
          id: 1,
          status: 1,
          valorEstimado: 1,
          prazo: 1,
          dataFechado: 1,
          clienteId: 1,
        },
      }
    )
    .toArray() as Promise<ProjetoResumo[]>;
}

export async function upsertProjeto(projeto: Projeto): Promise<void> {
  const db = await getDb();
  const col = db.collection<Projeto>(COLLECTION);
  await col.updateOne({ id: projeto.id }, { $set: projeto }, { upsert: true });
}

export async function patchProjeto(
  id: string,
  patch: Partial<Projeto>
): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection<Projeto>(COLLECTION)
    .updateOne({ id }, { $set: patch });
  return result.matchedCount > 0;
}

export async function deleteProjeto(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection<Projeto>(COLLECTION).deleteOne({ id });
  return result.deletedCount > 0;
}

/**
 * Acrescenta um arquivo ATÓMICAMENTE (update de 1 documento) — evita o lost
 * update do read-modify-write do array inteiro com escritas concorrentes.
 * Pipeline com $ifNull para funcionar mesmo se `arquivos` for null.
 */
export async function pushArquivo(
  projetoId: string,
  arquivo: ProjetoArquivo
): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection<Projeto>(COLLECTION).updateOne({ id: projetoId }, [
    {
      $set: {
        arquivos: {
          $concatArrays: [{ $ifNull: ["$arquivos", []] }, [arquivo]],
        },
      },
    },
  ]);
  return result.matchedCount > 0;
}

/** Remove um arquivo pelo id, atomicamente (ver pushArquivo). */
export async function pullArquivo(
  projetoId: string,
  arquivoId: string
): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection<Projeto>(COLLECTION).updateOne({ id: projetoId }, [
    {
      $set: {
        arquivos: {
          $filter: {
            input: { $ifNull: ["$arquivos", []] },
            as: "a",
            cond: { $ne: ["$$a.id", arquivoId] },
          },
        },
      },
    },
  ]);
  return result.matchedCount > 0;
}
