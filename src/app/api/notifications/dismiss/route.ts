import { z } from "zod";
import { dismissNotifs } from "@/lib/mongodb/notif-dismissed";
import { apiOk, apiError, withAuth, parseJson } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({
  ids: z.array(z.string().min(1).max(256)).max(100),
});

/**
 * POST /api/notifications/dismiss — dispensa uma ou mais notificações (global,
 * utilizador único). Body: { ids: string[] }. Esconde-as em todos os
 * dispositivos; não toca no lead/comentário/audit subjacente.
 */
export const POST = withAuth(async (_session, request) => {
  const parsed = await parseJson(request, schema);
  if (!parsed.ok) return parsed.response;

  try {
    await dismissNotifs(parsed.data.ids);
    return apiOk({ ok: true });
  } catch (error) {
    console.error("POST /api/notifications/dismiss error:", error);
    return apiError("Internal error", 500);
  }
});
