import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { upsertServico, getServicoById, getServicosBySlug } from "@/lib/mongodb/servicos";
import { logMutation } from "@/lib/mongodb/mutation-audit";
import { servicoInputSchema } from "@/lib/validation-servico";
import { deleteManagedBlob } from "@/lib/blob";
import type { Servico } from "@/types/servico";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = servicoInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const input = parsed.data;
  const id = input.id ?? randomUUID();
  const existing = input.id ? await getServicoById(input.id) : null;
  const now = new Date().toISOString();

  let ordem = input.ordem;
  if (ordem == null) {
    if (existing) ordem = existing.ordem;
    else {
      const irmaos = await getServicosBySlug(input.slug, false);
      ordem = irmaos.length;
    }
  }

  // `variantes` e `precoBase` são mutuamente exclusivos na intenção do user.
  // Se o input mandou `variantes` (mesmo []), respeita. Senão fallback ao existing.
  const variantes =
    input.variantes !== undefined ? input.variantes ?? null : existing?.variantes ?? null;
  const precoBase =
    input.precoBase !== undefined ? input.precoBase ?? null : existing?.precoBase ?? null;
  const precoMax =
    input.precoMax !== undefined ? input.precoMax ?? null : existing?.precoMax ?? null;
  const precoDesde =
    input.precoDesde !== undefined ? (input.precoDesde ?? false) : (existing?.precoDesde ?? false);

  const imageUrl =
    input.imageUrl !== undefined ? (input.imageUrl ?? null) : (existing?.imageUrl ?? null);

  // Cleanup blob antigo se imagem foi trocada/removida.
  let orphanUrl: string | null = null;
  if (existing?.imageUrl && existing.imageUrl !== imageUrl) {
    orphanUrl = existing.imageUrl;
  }

  const servico: Servico = {
    id,
    slug: input.slug,
    titulo: input.titulo,
    tituloI18n: input.tituloI18n ?? existing?.tituloI18n ?? null,
    descricao: input.descricao ?? existing?.descricao ?? null,
    descricaoI18n: input.descricaoI18n ?? existing?.descricaoI18n ?? null,
    precoBase: variantes && variantes.length > 0 ? null : precoBase,
    precoMax: variantes && variantes.length > 0 ? null : precoMax,
    precoDesde,
    variantes: variantes && variantes.length > 0 ? variantes : null,
    precoTexto: input.precoTexto ?? existing?.precoTexto ?? null,
    precoTextoI18n: input.precoTextoI18n ?? existing?.precoTextoI18n ?? null,
    nota: input.nota ?? existing?.nota ?? null,
    notaI18n: input.notaI18n ?? existing?.notaI18n ?? null,
    imageUrl,
    ordem,
    ativo: input.ativo ?? existing?.ativo ?? true,
    criadoEm: existing?.criadoEm ?? now,
    atualizadoEm: now,
  };

  await upsertServico(servico);
  if (orphanUrl) {
    await deleteManagedBlob(orphanUrl);
  }
  await logMutation({
    collection: "servicos",
    entityId: id,
    op: existing ? "update" : "create",
    userEmail: session.user.email ?? null,
    after: servico,
  });
  revalidatePath("/servicos");
  revalidatePath(`/servicos/${input.slug}`);
  return NextResponse.json({ ok: true, id });
}
