import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { upsertServico, getServicoById, getServicosBySlug } from "@/lib/mongodb/servicos";
import { servicoInputSchema } from "@/lib/validation-servico";
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

  const servico: Servico = {
    id,
    slug: input.slug,
    titulo: input.titulo,
    descricao: input.descricao ?? existing?.descricao ?? null,
    precoBase: variantes && variantes.length > 0 ? null : precoBase,
    precoMax: variantes && variantes.length > 0 ? null : precoMax,
    variantes: variantes && variantes.length > 0 ? variantes : null,
    precoTexto: input.precoTexto ?? existing?.precoTexto ?? null,
    nota: input.nota ?? existing?.nota ?? null,
    ordem,
    ativo: input.ativo ?? existing?.ativo ?? true,
    criadoEm: existing?.criadoEm ?? now,
    atualizadoEm: now,
  };

  await upsertServico(servico);
  return NextResponse.json({ ok: true, id });
}
