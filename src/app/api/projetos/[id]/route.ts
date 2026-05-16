import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteProjeto } from "@/lib/mongodb/projetos";
import { deleteTarefasByProjeto } from "@/lib/mongodb/tarefas";

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

  await deleteTarefasByProjeto(id);
  const ok = await deleteProjeto(id);
  if (!ok) {
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
