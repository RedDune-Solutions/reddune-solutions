import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { deleteProjeto, getProjetoById } from "@/lib/mongodb/projetos";
import { deleteTarefasByProjeto } from "@/lib/mongodb/tarefas";
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

  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const existing = await getProjetoById(id);
    await deleteTarefasByProjeto(id);
    const ok = await deleteProjeto(id);
    if (!ok) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
    }

    await logMutation({
      collection: "projetos",
      entityId: id,
      op: "delete",
      userEmail: session.user.email ?? null,
      before: existing,
    });

    revalidatePath("/painel/projetos");
    revalidatePath("/painel/tarefas");
    revalidatePath("/painel/dividas");
    revalidatePath("/painel");

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
