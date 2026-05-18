import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { upsertProduct } from "@/lib/mongodb/products";

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
      imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls.map(String) : [],
      available: body.available !== false,
      featured: body.featured === true,
    });

    revalidatePath("/loja");
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
