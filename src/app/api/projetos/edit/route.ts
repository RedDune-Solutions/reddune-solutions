import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { patchProjeto, getProjetoById } from "@/lib/mongodb/projetos";
import { logMutation } from "@/lib/mongodb/mutation-audit";
import { PROJETO_STATUS } from "@/types/projeto";

export const dynamic = "force-dynamic";

const payloadSchema = z.discriminatedUnion("field", [
  z.object({
    projetoId: z.string().min(1),
    field: z.literal("status"),
    newValue: z.enum(PROJETO_STATUS),
  }),
  z.object({
    projetoId: z.string().min(1),
    field: z.literal("proximaAccao"),
    newValue: z.string().max(500),
  }),
]);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  let patch: Record<string, unknown>;
  if (parsed.data.field === "status") {
    patch = { status: parsed.data.newValue };
    // Auto-set dataFechado quando muda para terminado/fechado e ainda não está definido
    if (parsed.data.newValue === "terminado" || parsed.data.newValue === "fechado") {
      const existing = await getProjetoById(parsed.data.projetoId);
      if (existing && !existing.dataFechado) {
        patch.dataFechado = new Date().toISOString().slice(0, 10);
      }
    }
  } else {
    patch = { proximaAccao: parsed.data.newValue || null };
  }

  const ok = await patchProjeto(parsed.data.projetoId, patch);
  if (!ok) {
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  }

  await logMutation({
    collection: "projetos",
    entityId: parsed.data.projetoId,
    op: "update",
    userEmail: session.user.email ?? null,
    after: patch,
  });

  revalidatePath("/painel/projetos");
  revalidatePath(`/painel/projetos/${parsed.data.projetoId}`);
  revalidatePath("/painel/dividas");
  revalidatePath("/painel");

  return NextResponse.json({ ok: true });
}
