import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { setBaseTipoRemovido } from "@/lib/mongodb/projeto-tipos-config";
import { PROJETO_TIPO } from "@/types/projeto";

export const dynamic = "force-dynamic";

const BASE = new Set<string>(PROJETO_TIPO);

/** Remove/repõe um tipo BASE do picker (não apaga nada; só esconde/mostra). */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = (body as { slug?: unknown } | null)?.slug;
  const removido = (body as { removido?: unknown } | null)?.removido;
  if (typeof slug !== "string" || !BASE.has(slug) || typeof removido !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    await setBaseTipoRemovido(slug, removido);
    revalidatePath("/painel/definicoes");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
