import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { upsertTarefa } from "@/lib/mongodb/tarefas";
import { tarefaManualSchema } from "@/lib/validation-tarefa";
import type { Tarefa } from "@/types/tarefa";

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

  const parsed = tarefaManualSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const id = input.id ?? randomUUID();
  const now = new Date().toISOString().slice(0, 10);

  const tarefa: Tarefa = {
    id,
    titulo: input.titulo,
    cliente: input.cliente ?? null,
    proximaAccao: input.proximaAccao ?? null,
    status: input.status,
    tipo: input.tipo ?? null,
    responsavel: input.responsavel ?? null,
    prazo: input.prazo ?? null,
    dataCriado: input.id ? null : now,
    dataFechado: input.dataFechado ?? null,
    valorEstimado: input.valorEstimado ?? null,
    valorPago: input.valorPago ?? null,
    metodoPagamento: input.metodoPagamento ?? null,
    local: input.local ?? null,
    notasResumo: input.notasResumo ?? null,
    bodyMd: input.bodyMd ?? null,
    pasta: input.pasta,
    sourcePath: null,
    origin: "manual",
  };

  await upsertTarefa(tarefa);

  return NextResponse.json({ ok: true, id });
}
