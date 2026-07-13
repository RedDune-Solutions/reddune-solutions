import "server-only";
import { getDb } from "./client";

const COLLECTION = "notif_dismissidas";

/**
 * Notificações dispensadas — global (utilizador único, vários dispositivos).
 * As notificações são derivadas (leads/comentários/audit), sem colecção
 * própria; aqui guardam-se só os IDs dispensados para os esconder em todo o
 * lado. Cada doc { notifId, at }; TTL de 1 ano evita crescimento sem fim (um
 * lead/comentário já tratado há tanto tempo não reaparece na prática).
 */
type DismissedDoc = { notifId: string; at: Date };

export async function getDismissedNotifIds(): Promise<Set<string>> {
  const db = await getDb();
  const docs = await db
    .collection<DismissedDoc>(COLLECTION)
    .find({}, { projection: { notifId: 1, _id: 0 } })
    .toArray();
  return new Set(docs.map((d) => d.notifId));
}

export async function dismissNotifs(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  const at = new Date();
  await db.collection<DismissedDoc>(COLLECTION).bulkWrite(
    ids.map((notifId) => ({
      updateOne: {
        filter: { notifId },
        update: { $setOnInsert: { notifId, at } },
        upsert: true,
      },
    })),
    { ordered: false }
  );
}
