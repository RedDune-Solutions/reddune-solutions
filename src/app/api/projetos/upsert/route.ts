import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { upsertProjeto, getProjetoById } from "@/lib/mongodb/projetos";
import { projetoInputSchema } from "@/lib/validation-projeto";
import type { Projeto } from "@/types/projeto";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = projetoInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const id = input.id ?? randomUUID();
  const now = new Date().toISOString().slice(0, 10);

  const existing = input.id ? await getProjetoById(input.id) : null;

  // Merge: undefined no input preserva existing; null explícito apaga
  const pick = <K extends keyof Projeto>(
    key: K,
    fallback: Projeto[K]
  ): Projeto[K] => {
    const v = (input as Record<string, unknown>)[key as string];
    if (v === undefined) return existing?.[key] ?? fallback;
    return v as Projeto[K];
  };

  const projeto: Projeto = {
    id,
    titulo: input.titulo ?? existing?.titulo ?? "",
    clienteId: pick("clienteId", null),
    clienteNome: pick("clienteNome", null),
    proximaAccao: pick("proximaAccao", null),
    status: input.status ?? existing?.status ?? "proximo",
    tipo: pick("tipo", null),
    responsavel: pick("responsavel", null),
    prazo: pick("prazo", null),
    dataCriado: input.id ? (existing?.dataCriado ?? input.dataCriado ?? now) : now,
    dataFechado: pick("dataFechado", null),
    valorEstimado: pick("valorEstimado", null),
    valorPago: pick("valorPago", null),
    metodoPagamento: pick("metodoPagamento", null),
    local: pick("local", null),
    notasResumo: pick("notasResumo", null),
    bodyMd: pick("bodyMd", null),
    linhas: pick("linhas", null),
    garantiaAte: pick("garantiaAte", null),
  };

  await upsertProjeto(projeto);
  return NextResponse.json({ ok: true, id });
}
