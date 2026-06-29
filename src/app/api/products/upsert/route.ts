import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { upsertProduct, getProductById } from "@/lib/mongodb/products";
import { logMutation } from "@/lib/mongodb/mutation-audit";
import { deleteManagedBlobs } from "@/lib/blob";
import { productInputSchema } from "@/lib/validation-product";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const input = parsed.data;

  try {
    // namePt já validado como não-vazio pelo schema (trim aplicado).
    const namePt = input.name.pt;

    const wasUpdate = typeof input.id === "string";
    const newImageUrls = input.imageUrls ?? [];

    // Cleanup blobs órfãos: URLs que estavam em existing mas saíram do novo.
    let orphanedUrls: string[] = [];
    if (wasUpdate) {
      const existing = await getProductById(input.id as string);
      if (existing) {
        const newSet = new Set(newImageUrls);
        orphanedUrls = existing.imageUrls.filter((u) => !newSet.has(u));
      }
    }

    const id = await upsertProduct({
      id: typeof input.id === "string" ? input.id : undefined,
      name: {
        pt: namePt,
        en: input.name.en ?? namePt,
      },
      description: {
        pt: input.description?.pt ?? "",
        en: input.description?.en ?? "",
      },
      category: {
        pt: input.category?.pt ?? "outro",
        en: input.category?.en ?? "other",
      },
      condition: {
        pt: input.condition?.pt ?? "novo",
        en: input.condition?.en ?? "new",
      },
      price: input.price ?? 0,
      imageUrls: newImageUrls,
      available: input.available !== false,
      featured: input.featured === true,
    });

    // Best-effort cleanup após save bem-sucedido.
    if (orphanedUrls.length > 0) {
      await deleteManagedBlobs(orphanedUrls);
    }

    await logMutation({
      collection: "products",
      entityId: id,
      op: wasUpdate ? "update" : "create",
      userEmail: session.user.email ?? null,
    });
    revalidatePath("/loja");
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
