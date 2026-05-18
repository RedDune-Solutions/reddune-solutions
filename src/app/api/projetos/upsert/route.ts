import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { upsertProjeto, getProjetoById } from "@/lib/mongodb/projetos";
import { projetoInputSchema } from "@/lib/validation-projeto";
import { TIPO_TO_CATEGORIA, type Projeto } from "@/types/projeto";

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

  // Multi-tipo: tipos array drives single tipo + categoria derivation
  const tiposInput = (input as Record<string, unknown>).tipos;
  let tiposFinal: import("@/types/projeto").ProjetoTipo[] | null;
  if (tiposInput === undefined) {
    tiposFinal = existing?.tipos ?? null;
  } else if (tiposInput === null) {
    tiposFinal = null;
  } else {
    tiposFinal = tiposInput as import("@/types/projeto").ProjetoTipo[];
  }

  let tipoFinal = pick("tipo", null);
  // If tipos provided, derive tipo from first element for compat
  if (tiposInput !== undefined) {
    tipoFinal = tiposFinal && tiposFinal.length > 0 ? tiposFinal[0] : null;
  }

  let categoriaFinal = pick("categoria", null);
  if (categoriaFinal == null && tiposFinal && tiposFinal.length > 0) {
    const derived = tiposFinal.map((t) => TIPO_TO_CATEGORIA[t]).filter((c) => c != null);
    if (derived.length > 0) categoriaFinal = derived[0]!;
  }
  if (categoriaFinal == null && tipoFinal != null) {
    categoriaFinal = TIPO_TO_CATEGORIA[tipoFinal];
  }

  const projeto: Projeto = {
    id,
    titulo: input.titulo ?? existing?.titulo ?? "",
    clienteId: pick("clienteId", null),
    clienteNome: pick("clienteNome", null),
    proximaAccao: pick("proximaAccao", null),
    status: input.status ?? existing?.status ?? "proximo",
    categoria: categoriaFinal,
    tipo: tipoFinal,
    tipos: tiposFinal,
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
    hardware: pick("hardware", null),
  };

  try {
    await upsertProjeto(projeto);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
