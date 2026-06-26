import { revalidatePath } from "next/cache";
import { withAuth, apiOk, apiError } from "@/lib/api";
import { blockIp, unblockIp, getBlockedIps } from "@/lib/mongodb/blocked-ips";

export const dynamic = "force-dynamic";

export const GET = withAuth(async () => {
  return apiOk({ ips: await getBlockedIps() });
});

export const POST = withAuth(async (_session, request) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON", 400);
  }
  const b = body as { ip?: unknown; action?: unknown; motivo?: unknown };
  const ip = typeof b?.ip === "string" ? b.ip.trim() : "";
  if (!ip) return apiError("Invalid ip", 400);

  if (b?.action === "unblock") {
    await unblockIp(ip);
  } else {
    await blockIp(ip, typeof b?.motivo === "string" ? b.motivo : null);
  }
  revalidatePath("/painel/leads");
  return apiOk({ ok: true });
});
