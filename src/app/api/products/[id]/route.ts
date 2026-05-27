import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { deleteProduct, getProductById } from "@/lib/mongodb/products";
import { logMutation } from "@/lib/mongodb/mutation-audit";
import { deleteManagedBlobs } from "@/lib/blob";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const existing = await getProductById(id);
    const ok = await deleteProduct(id);
    if (ok) {
      if (existing && existing.imageUrls.length > 0) {
        await deleteManagedBlobs(existing.imageUrls);
      }
      await logMutation({
        collection: "products",
        entityId: id,
        op: "delete",
        userEmail: session.user.email ?? null,
      });
    }
    revalidatePath("/loja");
    return NextResponse.json({ ok });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
