import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withAuth, apiOk, parseJson } from "@/lib/api";
import { blockIp, unblockIp, getBlockedIps } from "@/lib/mongodb/blocked-ips";
import { logMutation } from "@/lib/mongodb/mutation-audit";

export const dynamic = "force-dynamic";

// Formato IPv4 ou IPv6 (validação simples; comprimento máx. 45 = IPv6 textual).
const IP_RE =
  /^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

const blockedIpSchema = z.object({
  ip: z
    .string()
    .trim()
    .min(1)
    .max(45)
    .refine((v) => IP_RE.test(v), { message: "IP inválido." }),
  motivo: z.string().trim().max(500).optional(),
  action: z.enum(["block", "unblock"]).optional(),
});

export const GET = withAuth(async () => {
  return apiOk({ ips: await getBlockedIps() });
});

export const POST = withAuth(async (session, request) => {
  const parsed = await parseJson(request, blockedIpSchema);
  if (!parsed.ok) return parsed.response;

  const { ip, motivo, action } = parsed.data;

  if (action === "unblock") {
    await unblockIp(ip);
    await logMutation({
      collection: "blocked_ips",
      entityId: ip,
      op: "delete",
      userEmail: session.user?.email ?? null,
      before: { ip },
    });
  } else {
    await blockIp(ip, motivo ?? null);
    await logMutation({
      collection: "blocked_ips",
      entityId: ip,
      op: "create",
      userEmail: session.user?.email ?? null,
      after: { ip, motivo: motivo ?? null },
    });
  }
  revalidatePath("/painel/leads");
  return apiOk({ ok: true });
});
