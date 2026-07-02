import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { deleteProjeto, getProjetoById } from "@/lib/mongodb/projetos";
import { deleteTarefasByProjeto } from "@/lib/mongodb/tarefas";
import { logMutation } from "@/lib/mongodb/mutation-audit";
import { deleteManagedBlobs } from "@/lib/blob";

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

    // Limpa os blobs dos arquivos ANTES do delete — senão ficam órfãos e pagos,
    // irrecuperáveis. Best-effort: uma falha de cleanup não pode quebrar o delete.
    try {
      await deleteManagedBlobs(
        (existing?.arquivos ?? []).map((a) => a.blobUrl).filter((u): u is string => Boolean(u))
      );
    } catch (err) {
      console.error("Falha a limpar blobs do projeto (delete continua):", err);
    }

    await deleteTarefasByProjeto(id);
    const ok = await deleteProjeto(id);
    if (!ok) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
    }

    // Os `pagamentos` com este projetoId ficam INTENCIONALMENTE como histórico —
    // é receita real registada e apagá-los violaria a regra de não tocar em dados
    // de negócio. Não são removidos aqui.

    await logMutation({
      collection: "projetos",
      entityId: id,
      op: "delete",
      userEmail: session.user.email ?? null,
      before: existing,
    });

    revalidatePath("/painel/projetos");
    revalidatePath("/painel/tarefas");
    revalidatePath("/painel/calendario");
    revalidatePath("/painel/dividas");
    revalidatePath("/painel");

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
