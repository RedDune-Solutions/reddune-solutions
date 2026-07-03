import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getSandboxById, deleteSandbox } from "@/lib/mongodb/portal-sandbox";
import { deleteManagedBlobs } from "@/lib/blob";
import { logMutation } from "@/lib/mongodb/mutation-audit";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function DELETE(request: Request, { params }: { params: Params }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const sandbox = await getSandboxById(id);
  if (!sandbox) return NextResponse.json({ error: "Sandbox não encontrado" }, { status: 404 });

  // Apaga os blobs primeiro (best-effort) e depois o documento.
  await deleteManagedBlobs(sandbox.ficheiros.map((f) => f.blobUrl));
  const ok = await deleteSandbox(id);
  if (!ok) return NextResponse.json({ error: "Falha ao remover" }, { status: 500 });

  await logMutation({
    collection: "projetos",
    entityId: sandbox.projetoId,
    op: "update",
    userEmail: session.user.email ?? null,
    after: { sandboxRemovido: { id, nome: sandbox.nome } },
  });

  revalidatePath(`/painel/projetos/${sandbox.projetoId}`);
  return NextResponse.json({ ok: true });
}
