import "server-only";
import { getDb } from "./client";

export type PushSubscriptionDoc = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userEmail: string | null;
  criadoEm: string;
};

const COLLECTION = "push_subscriptions";

export async function upsertSubscription(sub: PushSubscriptionDoc): Promise<void> {
  const db = await getDb();
  await db
    .collection<PushSubscriptionDoc>(COLLECTION)
    .updateOne({ endpoint: sub.endpoint }, { $set: sub }, { upsert: true });
}

export async function getAllSubscriptions(): Promise<PushSubscriptionDoc[]> {
  const db = await getDb();
  return db
    .collection<PushSubscriptionDoc>(COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .toArray();
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  const db = await getDb();
  await db.collection<PushSubscriptionDoc>(COLLECTION).deleteOne({ endpoint });
}
