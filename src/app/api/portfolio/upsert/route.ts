import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { upsertPortfolioItem, getPortfolioItemById } from "@/lib/mongodb/portfolio";
import { logMutation } from "@/lib/mongodb/mutation-audit";
import { deleteManagedBlob } from "@/lib/blob";
import { SERVICO_SLUG } from "@/types/servico";
import type { PortfolioCategoria } from "@/types/portfolio";
import { portfolioInputSchema } from "@/lib/validation-portfolio";

export const dynamic = "force-dynamic";

const VALID = new Set<string>(SERVICO_SLUG);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = portfolioInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const input = parsed.data;

  try {
    // titlePt já validado como não-vazio pelo schema (trim aplicado).
    const titlePt = input.title.pt;

    // Categoria continua a ser validada contra SERVICO_SLUG: inválida => null.
    const rawCat = input.categoria;
    const categoria: PortfolioCategoria | null =
      typeof rawCat === "string" && VALID.has(rawCat) ? (rawCat as PortfolioCategoria) : null;

    const wasUpdate = typeof input.id === "string";
    const newImageUrl = (input.imageUrl ?? "").trim();

    // Cleanup blob antigo se imagem foi trocada.
    let orphanUrl: string | null = null;
    if (wasUpdate) {
      const existing = await getPortfolioItemById(input.id as string);
      if (existing && existing.imageUrl && existing.imageUrl !== newImageUrl) {
        orphanUrl = existing.imageUrl;
      }
    }

    const id = await upsertPortfolioItem({
      id: typeof input.id === "string" ? input.id : undefined,
      title: {
        pt: titlePt,
        en: input.title.en ?? titlePt,
      },
      imageUrl: newImageUrl,
      url: (input.url ?? "").trim(),
      categoria,
      destaqueLanding: input.destaqueLanding === true,
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
