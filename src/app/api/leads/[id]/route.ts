import { revalidatePath } from "next/cache";
import { withAuth, apiOk, apiError } from "@/lib/api";
import { updateLeadEstado, deleteLead, getLeadById } from "@/lib/mongodb/leads";
import { logMutation } from "@/lib/mongodb/mutation-audit";
import { LEAD_ESTADOS, type LeadEstado } from "@/types/lead";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const isEstado = (v: unknown): v is LeadEstado =>
  typeof v === "string" && (LEAD_ESTADOS as readonly string[]).includes(v);

export const PATCH = withAuth(async (session, request, { params }: Ctx) => {
  const { id } = await params;
  if (!id) return apiError("Missing id", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON", 400);
  }

  const estado = (body as { estado?: unknown })?.estado;
  if (!isEstado(estado)) return apiError("Invalid estado", 400);

  const ok = await updateLeadEstado(id, estado);
  if (!ok) return apiError("Lead not found", 404);

  await logMutation({
    collection: "leads",
    entityId: id,
    op: "update",
    userEmail: session.user?.email ?? null,
    after: { estado },
  });

  revalidatePath("/painel/leads");
  return apiOk({ ok: true });
});

export const DELETE = withAuth(async (session, _request, { params }: Ctx) => {
  const { id } = await params;
  if (!id) return apiError("Missing id", 400);

  // Lê o lead antes de apagar — o audit_log fica com a única cópia do dado.
  const lead = await getLeadById(id);

  const ok = await deleteLead(id);
  if (!ok) return apiError("Lead not found", 404);

  await logMutation({
    collection: "leads",
    entityId: id,
    op: "delete",
    userEmail: session.user?.email ?? null,
    before: lead,
  });

  revalidatePath("/painel/leads");
  return apiOk({ ok: true });
});
