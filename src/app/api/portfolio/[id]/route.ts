import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  deletePortfolioItem,
  getPortfolioItemById,
  setPortfolioEscondido,
} from "@/lib/mongodb/portfolio";
import { logMutation } from "@/lib/mongodb/mutation-audit";
import { deleteManagedBlob } from "@/lib/blob";

export const dynamic = "force-dynamic";

/** Toggle de visibilidade no site público — só mexe no campo `escondido`. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const escondido = (body as { escondido?: unknown } | null)?.escondido;
  if (typeof escondido !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const { id } = await params;
    const ok = await setPortfolioEscondido(id, escondido);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await logMutation({
      collection: "portfolio",
      entityId: id,
      op: "update",
      userEmail: session.user.email ?? null,
      after: { escondido },
    });
    revalidatePath("/portfolio");
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

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
