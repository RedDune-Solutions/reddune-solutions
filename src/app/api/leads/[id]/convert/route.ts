import { revalidatePath } from "next/cache";
import { withAuth, apiOk, apiError } from "@/lib/api";
import { getLeadById, setLeadCliente } from "@/lib/mongodb/leads";
import { createClienteFromLead } from "@/lib/mongodb/clientes";
import { logMutation } from "@/lib/mongodb/mutation-audit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Converte um lead em cliente: cria (ou reutiliza, por email) o cliente,
 * liga o lead ao clienteId e marca-o como "ganho". Aditivo — não apaga nada.
 */
export const POST = withAuth(async (session, _request, { params }: Ctx) => {
  const { id } = await params;
  if (!id) return apiError("Missing id", 400);

  const lead = await getLeadById(id);
  if (!lead) return apiError("Lead não encontrado", 404);
  if (lead.clienteId) return apiError("Lead já convertido em cliente", 409);

  const { cliente, created } = await createClienteFromLead(lead);

  const linked = await setLeadCliente(id, cliente.id);
  if (!linked) return apiError("Lead não encontrado", 404);

  if (created) {
    await logMutation({
      collection: "clientes",
      entityId: cliente.id,
      op: "create",
      userEmail: session.user.email ?? null,
      after: cliente,
    });
  }
  await logMutation({
    collection: "leads",
    entityId: id,
    op: "update",
    userEmail: session.user.email ?? null,
    before: lead,
    after: { ...lead, clienteId: cliente.id, estado: "ganho" },
  });

  revalidatePath("/painel/leads");
  revalidatePath("/painel/clientes");
  revalidatePath(`/painel/clientes/${cliente.id}`);

  return apiOk({ clienteId: cliente.id, created });
});
