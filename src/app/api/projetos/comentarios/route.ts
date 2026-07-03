import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { marcarComentarioLido } from "@/lib/mongodb/portal";

export const dynamic = "force-dynamic";

// Painel: marcar comentário do portal como lido.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { comentarioId?: string; projetoId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.comentarioId) {
    return NextResponse.json({ error: "comentarioId em falta" }, { status: 400 });
  }

  const ok = await marcarComentarioLido(body.comentarioId);
  if (body.projetoId) revalidatePath(`/painel/projetos/${body.projetoId}`);
  return NextResponse.json({ ok });
}
