import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { upsertPortfolioItem, getPortfolioItemById } from "@/lib/mongodb/portfolio";
import { logMutation } from "@/lib/mongodb/mutation-audit";
import { deleteManagedBlob } from "@/lib/blob";
import { SERVICO_SLUG } from "@/types/servico";
import type { PortfolioCategoria } from "@/types/portfolio";

export const dynamic = "force-dynamic";

const VALID = new Set<string>(SERVICO_SLUG);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const titlePt = String((body.title as Record<string, unknown>)?.pt ?? "").trim();
    if (!titlePt) {
      return NextResponse.json({ error: "Título PT obrigatório" }, { status: 400 });
    }

    const rawCat = body.categoria;
    const categoria: PortfolioCategoria | null =
      typeof rawCat === "string" && VALID.has(rawCat) ? (rawCat as PortfolioCategoria) : null;

    const wasUpdate = typeof body.id === "string";
    const newImageUrl = String(body.imageUrl ?? "").trim();

    // Cleanup blob antigo se imagem foi trocada.
    let orphanUrl: string | null = null;
    if (wasUpdate) {
      const existing = await getPortfolioItemById(body.id as string);
      if (existing && existing.imageUrl && existing.imageUrl !== newImageUrl) {
        orphanUrl = existing.imageUrl;
      }
    }

    const id = await upsertPortfolioItem({
      id: typeof body.id === "string" ? body.id : undefined,
      title: {
        pt: titlePt,
        en: String((body.title as Record<string, unknown>)?.en ?? titlePt),
      },
      imageUrl: newImageUrl,
      url: String(body.url ?? "").trim(),
      categoria,
      destaqueLanding: body.destaqueLanding === true,
    });

    if (orphanUrl) {
      await deleteManagedBlob(orphanUrl);
    }

    await logMutation({
      collection: "portfolio",
      entityId: id,
      op: wasUpdate ? "update" : "create",
      userEmail: session.user.email ?? null,
    });
    revalidatePath("/portfolio");
    revalidatePath("/");
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
