import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteTarefa } from "@/lib/mongodb/tarefas";

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

  const ok = await deleteTarefa(id);
  if (!ok) {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
