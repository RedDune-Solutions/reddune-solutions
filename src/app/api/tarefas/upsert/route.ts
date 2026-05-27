import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { upsertTarefa } from "@/lib/mongodb/tarefas";
import { logMutation } from "@/lib/mongodb/mutation-audit";
import { tarefaInputSchema } from "@/lib/validation-projeto";
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

  const parsed = tarefaInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const id = input.id ?? randomUUID();
  const now = new Date().toISOString();

  const tarefa: Tarefa = {
    id,
    projetoId: input.projetoId,
    titulo: input.titulo,
    feita: input.feita ?? false,
    prazo: input.prazo ?? null,
    prazoHora: input.prazoHora ?? null,
    notas: input.notas ?? null,
    ordem: input.ordem ?? 0,
    criadoEm: input.criadoEm ?? now,
  };

  await upsertTarefa(tarefa);
  await logMutation({
    collection: "tarefas",
    entityId: id,
    op: input.id ? "update" : "create",
    userEmail: session.user.email ?? null,
    after: tarefa,
  });
  revalidatePath("/painel/tarefas");
  revalidatePath("/painel/calendario");
  revalidatePath(`/painel/projetos/${input.projetoId}`);
  revalidatePath("/painel");
  return NextResponse.json({ ok: true, id });
}
