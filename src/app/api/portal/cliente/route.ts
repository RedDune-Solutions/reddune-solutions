import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { resolvePortalToken } from "@/lib/portal-auth";
import { clientePatchSchema } from "@/lib/validation-portal";
import { getClienteById, upsertCliente } from "@/lib/mongodb/clientes";
import { toPortalCliente } from "@/lib/portal-dto";
import { rateLimitDistributed, getClientIp } from "@/lib/rate-limit";
import { logMutation } from "@/lib/mongodb/mutation-audit";

export const dynamic = "force-dynamic";

// Ficha "Os teus dados": o cliente só escreve na whitelist (schema estrito);
// tudo auditado em audit_log com origem portal:<projetoId>.
export async function PATCH(request: Request) {
  const ip = getClientIp(request);
  const rl = await rateLimitDistributed(`portal-cliente:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body: { t?: unknown; dados?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const projeto = await resolvePortalToken(body.t);
  if (!projeto) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (!projeto.clienteId) {
    return NextResponse.json({ error: "Projeto sem ficha de cliente" }, { status: 400 });
  }

  const parsed = clientePatchSchema.safeParse(body.dados);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const patch = parsed.data;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  }

  const cliente = await getClienteById(projeto.clienteId);
  if (!cliente) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const atualizado = { ...cliente, ...patch };
  try {
    await upsertCliente(atualizado);
  } catch (e: unknown) {
    // Índices únicos de email/nif → 11000 duplicate key.
    const code = e && typeof e === "object" && "code" in e ? (e as { code?: number }).code : undefined;
    if (code === 11000) {
      return NextResponse.json({ error: "Email ou NIF já registado noutro cliente" }, { status: 409 });
    }
    throw e;
  }

  await logMutation({
    collection: "clientes",
    entityId: cliente.id,
    op: "update",
    userEmail: `portal:${projeto.id}`,
    before: toPortalCliente(cliente),
    after: toPortalCliente(atualizado),
  });

  revalidatePath(`/painel/clientes/${cliente.id}`);
  return NextResponse.json({ cliente: toPortalCliente(atualizado) });
}
