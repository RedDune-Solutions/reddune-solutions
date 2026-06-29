import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { deleteTarefa, getTarefaProjetoId } from "@/lib/mongodb/tarefas";
import { logMutation } from "@/lib/mongodb/mutation-audit";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // Lê o projetoId antes de apagar para revalidar a página do projeto.
  const projetoId = await getTarefaProjetoId(id);

  const ok = await deleteTarefa(id);
  if (!ok) {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  }

  await logMutation({
    collection: "tarefas",
    entityId: id,
    op: "delete",
    userEmail: session.user.email ?? null,
  });

  revalidatePath("/painel/tarefas");
  revalidatePath("/painel/calendario");
  revalidatePath("/painel");
  if (projetoId) revalidatePath(`/painel/projetos/${projetoId}`);
  return NextResponse.json({ ok: true });
}
