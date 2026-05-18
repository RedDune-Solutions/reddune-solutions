import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { getTarefaTemplateById } from "@/lib/mongodb/tarefa-templates";
import { upsertTarefa, getTarefasByProjeto } from "@/lib/mongodb/tarefas";
import type { Tarefa } from "@/types/tarefa";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { projetoId?: string; templateId?: string };
  try {
    body = (await request.json()) as { projetoId?: string; templateId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const projetoId = body.projetoId?.trim();
  const templateId = body.templateId?.trim();
  if (!projetoId || !templateId) {
    return NextResponse.json({ error: "Missing projetoId or templateId" }, { status: 400 });
  }

  try {
    const template = await getTarefaTemplateById(templateId);
    if (!template) {
      return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
    }

    const existing = await getTarefasByProjeto(projetoId);
    const baseOrdem = existing.length;
    const now = new Date().toISOString();

    let created = 0;
    const itens = [...template.itens].sort((a, b) => a.ordem - b.ordem);
    for (let i = 0; i < itens.length; i++) {
      const item = itens[i]!;
      const tarefa: Tarefa = {
        id: randomUUID(),
        projetoId,
        titulo: item.titulo,
        feita: false,
        prazo: null,
        prazoHora: null,
        notas: null,
        ordem: baseOrdem + i,
        criadoEm: now,
      };
      await upsertTarefa(tarefa);
      created += 1;
    }

    return NextResponse.json({ ok: true, created });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
