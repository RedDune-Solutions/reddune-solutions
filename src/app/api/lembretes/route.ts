import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllLembretes, getLembretesByProjeto } from "@/lib/mongodb/lembretes";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const projetoId = searchParams.get("projetoId");
    const lembretes = projetoId
      ? await getLembretesByProjeto(projetoId)
      : await getAllLembretes();
    return NextResponse.json({ lembretes }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/lembretes error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
