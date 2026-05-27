import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { deletePagamento } from "@/lib/mongodb/pagamentos";
import { logMutation } from "@/lib/mongodb/mutation-audit";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const ok = await deletePagamento(id);
  if (ok) {
    await logMutation({
      collection: "pagamentos",
      entityId: id,
      op: "delete",
      userEmail: session.user.email ?? null,
    });
  }
  revalidatePath("/painel/dividas");
  revalidatePath("/painel/relatorios");
  revalidatePath("/painel");
  return NextResponse.json({ ok });
}
