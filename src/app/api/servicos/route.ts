import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllServicos, getServicosBySlug } from "@/lib/mongodb/servicos";
import { SERVICO_SLUG, type ServicoSlug } from "@/types/servico";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  if (slug && (SERVICO_SLUG as readonly string[]).includes(slug)) {
    const items = await getServicosBySlug(slug as ServicoSlug, false);
    return NextResponse.json({ items });
  }
  const items = await getAllServicos();
  return NextResponse.json({ items });
}
