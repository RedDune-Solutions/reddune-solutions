import "server-only";
import webpush from "web-push";
import {
  getAllSubscriptions,
  deleteSubscription,
} from "./mongodb/push-subscriptions";

// Web Push self-hosted (VAPID + web-push). Sem FCM/OneSignal. Node runtime.
const PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:reddunesolutions@gmail.com";

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  if (!PUBLIC || !PRIVATE) return false; // chaves não definidas → no-op silencioso
  webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);
  configured = true;
  return true;
}

export type PushPayload = { title: string; body: string; url?: string };

/**
 * Envia push a TODAS as subscrições guardadas. Best-effort:
 * - no-op se as chaves VAPID não estiverem configuradas;
 * - apaga subscrições expiradas (404/410);
 * - nunca lança.
 */
export async function sendPushToAll(payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;
  let subs;
  try {
    subs = await getAllSubscriptions();
  } catch (e) {
    console.error("push: getAllSubscriptions failed:", e);
    return;
  }
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload)
        );
      } catch (err: unknown) {
        const code =
          err && typeof err === "object" && "statusCode" in err
            ? (err as { statusCode?: number }).statusCode
            : undefined;
        if (code === 404 || code === 410) {
          await deleteSubscription(s.endpoint).catch(() => {});
        } else {
          console.error("push send failed:", err);
        }
      }
    })
  );
}
