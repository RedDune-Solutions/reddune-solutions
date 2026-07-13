import "server-only";
import { getDb } from "./client";

const COLLECTION = "settings";
const ID = "projeto-tipos";

/**
 * Config dos tipos de serviço geridos em Definições. Guarda a lista de slugs
 * de tipos BASE que o utilizador removeu — as constantes de código
 * (PROJETO_TIPO_LABEL/TIPO_TO_CATEGORIA) ficam intactas para resolver o nome
 * em projectos antigos; esta lista só controla o que aparece no picker.
 * Doc único id:"projeto-tipos" na colecção `settings` (aditivo).
 */
export async function getBaseTiposRemovidos(): Promise<string[]> {
  const db = await getDb();
  const doc = await db
    .collection<{ id: string; baseRemovidos?: string[] }>(COLLECTION)
    .findOne({ id: ID }, { projection: { _id: 0, baseRemovidos: 1 } });
  return Array.isArray(doc?.baseRemovidos) ? doc.baseRemovidos : [];
}

type TiposConfigDoc = { id: string; baseRemovidos?: string[] };

export async function setBaseTipoRemovido(
  slug: string,
  removido: boolean
): Promise<void> {
  const db = await getDb();
  const col = db.collection<TiposConfigDoc>(COLLECTION);
  if (removido) {
    await col.updateOne({ id: ID }, { $addToSet: { baseRemovidos: slug } }, { upsert: true });
  } else {
    await col.updateOne({ id: ID }, { $pull: { baseRemovidos: slug } }, { upsert: true });
  }
}
