import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { upsertProduct, getProductById } from "@/lib/mongodb/products";
import { logMutation } from "@/lib/mongodb/mutation-audit";
import { deleteManagedBlobs } from "@/lib/blob";

export const dynamic = "force-dynamic";

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
    const namePt = String((body.name as Record<string, unknown>)?.pt ?? "").trim();
    if (!namePt) {
      return NextResponse.json({ error: "Nome PT obrigatório" }, { status: 400 });
    }

    const wasUpdate = typeof body.id === "string";
    const newImageUrls = Array.isArray(body.imageUrls) ? body.imageUrls.map(String) : [];

    // Cleanup blobs órfãos: URLs que estavam em existing mas saíram do novo.
    let orphanedUrls: string[] = [];
    if (wasUpdate) {
      const existing = await getProductById(body.id as string);
      if (existing) {
        const newSet = new Set(newImageUrls);
        orphanedUrls = existing.imageUrls.filter((u) => !newSet.has(u));
      }
    }

    const id = await upsertProduct({
      id: typeof body.id === "string" ? body.id : undefined,
      name: {
        pt: namePt,
        en: String((body.name as Record<string, unknown>)?.en ?? namePt),
      },
      description: {
        pt: String((body.description as Record<string, unknown>)?.pt ?? ""),
        en: String((body.description as Record<string, unknown>)?.en ?? ""),
      },
      category: {
        pt: String((body.category as Record<string, unknown>)?.pt ?? "outro"),
        en: String((body.category as Record<string, unknown>)?.en ?? "other"),
      },
      condition: {
        pt: String((body.condition as Record<string, unknown>)?.pt ?? "novo"),
        en: String((body.condition as Record<string, unknown>)?.en ?? "new"),
      },
      price: Number(body.price) || 0,
      imageUrls: newImageUrls,
      available: body.available !== false,
      featured: body.featured === true,
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
