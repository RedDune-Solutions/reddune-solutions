import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getTarefaById } from "@/lib/mongodb/tarefas";
import { queueEdit } from "@/lib/mongodb/edits";
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

  const tarefa = await getTarefaById(parsed.data.tarefaId);
  if (!tarefa) {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  }

  // Server reads sourcePath from MongoDB doc (TarefaPublic omits it),
  // re-fetch full record to get sourcePath.
  const client = await import("@/lib/mongodb/client").then((m) => m.default);
  const db = (await client).db(process.env.MONGODB_DB_NAME);
  const fullDoc = await db
    .collection("tarefas")
    .findOne({ id: parsed.data.tarefaId }, { projection: { sourcePath: 1 } });
  const sourcePath = (fullDoc?.sourcePath as string | undefined) ?? null;
  if (!sourcePath) {
    return NextResponse.json(
      { error: "Tarefa sem sourcePath" },
      { status: 422 }
    );
  }

  const editId = await queueEdit({
    tarefaId: parsed.data.tarefaId,
    sourcePath,
    field: parsed.data.field,
    newValue: parsed.data.newValue,
    requestedBy: (session.user as { id?: string }).id ?? null,
    requestedByEmail: session.user.email ?? null,
  });

  return NextResponse.json({ ok: true, editId });
}
