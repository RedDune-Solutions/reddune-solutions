import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { patchLembrete, getLembreteProjetoId } from "@/lib/mongodb/lembretes";
import { logMutation } from "@/lib/mongodb/mutation-audit";
import type { Lembrete } from "@/types/lembrete";

export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  lembreteId: z.string().min(1),
  patch: z.object({
    feita: z.boolean().optional(),
    titulo: z.string().min(1).max(300).optional(),
    prazo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
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

  const patch: Partial<Lembrete> = { ...parsed.data.patch };

  // Limpar a data tem de limpar também a hora — senão a prazoHora antiga fica
  // órfã e "ressuscita" quando se define uma data nova (aparece no calendário
  // a uma hora que o utilizador nunca escolheu para essa data).
  if (patch.prazo === null) {
    patch.prazoHora = null;
  }

  // Carimbo de conclusão só no servidor: o zod schema não aceita feitaEm do
  // cliente, por isso o valor é sempre deste bloco. Desmarcar limpa o carimbo
  // para o lembrete não aparecer como "resolvido há pouco" no /api/brief.
  if (patch.feita === true) {
    patch.feitaEm = new Date().toISOString();
  } else if (patch.feita === false) {
    patch.feitaEm = null;
  }

  // Lê o projetoId antes do patch para revalidar a página do projeto (o patch
  // nunca altera o projetoId, por isso o valor lido continua válido).
  const projetoId = await getLembreteProjetoId(parsed.data.lembreteId);

  const ok = await patchLembrete(parsed.data.lembreteId, patch);
  if (!ok) {
    return NextResponse.json({ error: "Lembrete não encontrado" }, { status: 404 });
  }

  await logMutation({
    collection: "lembretes",
    entityId: parsed.data.lembreteId,
    op: "update",
    userEmail: session.user.email ?? null,
    after: patch,
  });

  revalidatePath("/painel/lembretes");
  revalidatePath("/painel/calendario");
  revalidatePath("/painel");
  if (projetoId) revalidatePath(`/painel/projetos/${projetoId}`);

  return NextResponse.json({ ok: true });
}
