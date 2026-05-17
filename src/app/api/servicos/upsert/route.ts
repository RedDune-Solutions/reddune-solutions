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

  const servico: Servico = {
    id,
    slug: input.slug,
    titulo: input.titulo,
    descricao: input.descricao ?? existing?.descricao ?? null,
    precoBase: input.precoBase ?? existing?.precoBase ?? null,
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
