import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { deleteServico, getServicoById } from "@/lib/mongodb/servicos";
import { logMutation } from "@/lib/mongodb/mutation-audit";
import { deleteManagedBlob } from "@/lib/blob";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const existing = await getServicoById(id);
  const ok = await deleteServico(id);
  if (ok) {
    if (existing?.imageUrl) {
      await deleteManagedBlob(existing.imageUrl);
    }
    await logMutation({
      collection: "servicos",
      entityId: id,
      op: "delete",
      userEmail: session.user.email ?? null,
      before: existing,
    });
  }
  revalidatePath("/servicos");
  if (existing?.slug) revalidatePath(`/servicos/${existing.slug}`);
  return NextResponse.json({ ok });
}
