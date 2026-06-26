import { withAuth, apiOk, apiError } from "@/lib/api";
import { upsertSubscription } from "@/lib/mongodb/push-subscriptions";

export const dynamic = "force-dynamic";

export const POST = withAuth(async (session, request) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON", 400);
  }
  const b = body as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  const endpoint = b?.endpoint;
  const p256dh = b?.keys?.p256dh;
  const auth = b?.keys?.auth;
  if (
    typeof endpoint !== "string" ||
    typeof p256dh !== "string" ||
    typeof auth !== "string"
  ) {
    return apiError("Invalid subscription", 400);
  }

  await upsertSubscription({
    endpoint,
    p256dh,
    auth,
    userEmail: session.user.email ?? null,
    criadoEm: new Date().toISOString(),
  });
  return apiOk({ ok: true });
});
