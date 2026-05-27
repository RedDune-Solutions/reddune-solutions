import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { deletePortfolioItem, getPortfolioItemById } from "@/lib/mongodb/portfolio";
import { logMutation } from "@/lib/mongodb/mutation-audit";
import { deleteManagedBlob } from "@/lib/blob";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const existing = await getPortfolioItemById(id);
    const ok = await deletePortfolioItem(id);
    if (ok) {
      if (existing?.imageUrl) {
        await deleteManagedBlob(existing.imageUrl);
      }
      await logMutation({
        collection: "portfolio",
        entityId: id,
        op: "delete",
        userEmail: session.user.email ?? null,
      });
    }
    revalidatePath("/portfolio");
    revalidatePath("/");
    return NextResponse.json({ ok });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
