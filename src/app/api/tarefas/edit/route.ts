import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { patchTarefa } from "@/lib/mongodb/tarefas";
import { TAREFA_STATUS } from "@/types/tarefa";

export const dynamic = "force-dynamic";

const payloadSchema = z.discriminatedUnion("field", [
  z.object({
    tarefaId: z.string().min(1),
    field: z.literal("status"),
    newValue: z.enum(TAREFA_STATUS),
  }),
  z.object({
    tarefaId: z.string().min(1),
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

  const patch =
    parsed.data.field === "status"
      ? { status: parsed.data.newValue }
      : { proximaAccao: parsed.data.newValue || null };

  const ok = await patchTarefa(parsed.data.tarefaId, patch);
  if (!ok) {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
