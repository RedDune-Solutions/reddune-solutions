import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { deleteLembrete, getLembreteProjetoId } from "@/lib/mongodb/lembretes";
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
  const projetoId = await getLembreteProjetoId(id);

  const ok = await deleteLembrete(id);
  if (!ok) {
    return NextResponse.json({ error: "Lembrete não encontrado" }, { status: 404 });
  }

  await logMutation({
    collection: "lembretes",
    entityId: id,
    op: "delete",
    userEmail: session.user.email ?? null,
  });

  revalidatePath("/painel/lembretes");
  revalidatePath("/painel/calendario");
  revalidatePath("/painel");
  if (projetoId) revalidatePath(`/painel/projetos/${projetoId}`);
  return NextResponse.json({ ok: true });
}
