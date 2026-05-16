import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllTarefas, getTarefasByProjeto } from "@/lib/mongodb/tarefas";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const projetoId = searchParams.get("projetoId");
    const tarefas = projetoId
      ? await getTarefasByProjeto(projetoId)
      : await getAllTarefas();
    return NextResponse.json({ tarefas }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/tarefas error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
