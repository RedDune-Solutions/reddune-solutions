import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { patchTarefa } from "@/lib/mongodb/tarefas";
import { logMutation } from "@/lib/mongodb/mutation-audit";

export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  tarefaId: z.string().min(1),
  patch: z.object({
    feita: z.boolean().optional(),
    titulo: z.string().min(1).max(300).optional(),
    prazo: z.string().nullable().optional(),
    prazoHora: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
    notas: z.string().max(1000).nullable().optional(),
    ordem: z.number().int().optional(),
  }),
});

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

  const ok = await patchTarefa(parsed.data.tarefaId, parsed.data.patch);
  if (!ok) {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  }

  await logMutation({
    collection: "tarefas",
    entityId: parsed.data.tarefaId,
    op: "update",
    userEmail: session.user.email ?? null,
    after: parsed.data.patch,
  });

  revalidatePath("/painel/tarefas");
  revalidatePath("/painel/calendario");
  revalidatePath("/painel");

  return NextResponse.json({ ok: true });
}
