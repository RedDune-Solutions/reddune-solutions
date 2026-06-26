import { withAuth, apiOk, apiError } from "@/lib/api";
import { deleteSubscription } from "@/lib/mongodb/push-subscriptions";

export const dynamic = "force-dynamic";

export const POST = withAuth(async (_session, request) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON", 400);
  }
  const endpoint = (body as { endpoint?: unknown })?.endpoint;
  if (typeof endpoint !== "string") return apiError("Invalid endpoint", 400);

  await deleteSubscription(endpoint);
  return apiOk({ ok: true });
});
