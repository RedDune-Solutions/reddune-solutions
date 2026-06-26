import { revalidatePath } from "next/cache";
import { withAuth, apiOk, apiError } from "@/lib/api";
import { updateLeadEstado, deleteLead } from "@/lib/mongodb/leads";
import { LEAD_ESTADOS, type LeadEstado } from "@/types/lead";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const isEstado = (v: unknown): v is LeadEstado =>
  typeof v === "string" && (LEAD_ESTADOS as readonly string[]).includes(v);

export const PATCH = withAuth(async (_session, request, { params }: Ctx) => {
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

  revalidatePath("/painel/leads");
  return apiOk({ ok: true });
});

export const DELETE = withAuth(async (_session, _request, { params }: Ctx) => {
  const { id } = await params;
  if (!id) return apiError("Missing id", 400);

  const ok = await deleteLead(id);
  if (!ok) return apiError("Lead not found", 404);

  revalidatePath("/painel/leads");
  return apiOk({ ok: true });
});
