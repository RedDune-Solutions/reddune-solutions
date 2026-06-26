import "server-only";
import { getDb } from "./client";

export type BlockedIp = {
  ip: string;
  motivo: string | null;
  criadoEm: string;
};

const COLLECTION = "blocked_ips";

export async function isIpBlocked(ip: string): Promise<boolean> {
  if (!ip || ip === "unknown") return false;
  const db = await getDb();
  const hit = await db
    .collection<BlockedIp>(COLLECTION)
    .findOne({ ip }, { projection: { _id: 1 } });
  return Boolean(hit);
}

export async function blockIp(ip: string, motivo: string | null): Promise<void> {
  const db = await getDb();
  await db.collection<BlockedIp>(COLLECTION).updateOne(
    { ip },
    { $set: { ip, motivo, criadoEm: new Date().toISOString() } },
    { upsert: true }
  );
}

export async function unblockIp(ip: string): Promise<void> {
  const db = await getDb();
  await db.collection<BlockedIp>(COLLECTION).deleteOne({ ip });
}

export async function getBlockedIps(): Promise<BlockedIp[]> {
  const db = await getDb();
  return db
    .collection<BlockedIp>(COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .sort({ criadoEm: -1 })
    .toArray();
}
