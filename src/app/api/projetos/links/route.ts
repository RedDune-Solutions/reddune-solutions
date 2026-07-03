import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { getProjetoById, pushLink, pullLink } from "@/lib/mongodb/projetos";
import { linkSchema } from "@/lib/validation-portal";
import { logMutation } from "@/lib/mongodb/mutation-audit";

export const dynamic = "force-dynamic";

// Links de preview do projecto (protótipos com deploy — Vercel/Pages).
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { projetoId?: string; action?: string; label?: string; url?: string; linkId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { projetoId, action } = body;
  if (!projetoId || (action !== "add" && action !== "remove")) {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }
  const projeto = await getProjetoById(projetoId);
  if (!projeto) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

  if (action === "add") {
    const parsed = linkSchema.safeParse({ label: body.label, url: body.url });
    if (!parsed.success) {
      return NextResponse.json({ error: "Link inválido (https obrigatório)" }, { status: 400 });
    }
    const link = { id: randomUUID(), ...parsed.data };
    const ok = await pushLink(projetoId, link);
    if (!ok) return NextResponse.json({ error: "Falha ao guardar" }, { status: 500 });
    await logMutation({
      collection: "projetos",
      entityId: projetoId,
      op: "update",
      userEmail: session.user.email ?? null,
      after: { linkAdicionado: link },
    });
    revalidatePath(`/painel/projetos/${projetoId}`);
    return NextResponse.json({ link });
  }

  if (!body.linkId) return NextResponse.json({ error: "linkId em falta" }, { status: 400 });
  const ok = await pullLink(projetoId, body.linkId);
  if (!ok) return NextResponse.json({ error: "Falha ao remover" }, { status: 500 });
  await logMutation({
    collection: "projetos",
    entityId: projetoId,
    op: "update",
    userEmail: session.user.email ?? null,
    after: { linkRemovido: body.linkId },
  });
  revalidatePath(`/painel/projetos/${projetoId}`);
  return NextResponse.json({ ok: true });
}
