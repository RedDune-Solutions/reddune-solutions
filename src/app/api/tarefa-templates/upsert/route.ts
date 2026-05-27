import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import {
  getTarefaTemplateById,
  upsertTarefaTemplate,
} from "@/lib/mongodb/tarefa-templates";
import { tarefaTemplateInputSchema } from "@/lib/validation-tarefa-template";
import type { TarefaTemplate } from "@/types/tarefa-template";

export const dynamic = "force-dynamic";

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

  const parsed = tarefaTemplateInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const input = parsed.data;
    const id = input.id ?? randomUUID();
    const existing = input.id ? await getTarefaTemplateById(input.id) : null;
    const now = new Date().toISOString();

    const template: TarefaTemplate = {
      id,
      nome: input.nome ?? existing?.nome ?? "",
      categoria: input.categoria ?? existing?.categoria ?? null,
      tipos: input.tipos ?? existing?.tipos ?? [],
      itens: input.itens ?? existing?.itens ?? [],
      criadoEm: existing?.criadoEm ?? input.criadoEm ?? now,
    };

    await upsertTarefaTemplate(template);
    revalidatePath("/painel/definicoes");
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
