import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { deleteDespesa } from "@/lib/mongodb/despesas";
import { logMutation } from "@/lib/mongodb/mutation-audit";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const ok = await deleteDespesa(id);
  if (ok) {
    await logMutation({
      collection: "despesas",
      entityId: id,
      op: "delete",
      userEmail: session.user.email ?? null,
    });
  }
  revalidatePath("/painel/relatorios");
  revalidatePath("/painel");
  return NextResponse.json({ ok });
}
