import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { patchProjeto } from "@/lib/mongodb/projetos";
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

  const patch =
    parsed.data.field === "status"
      ? { status: parsed.data.newValue }
      : { proximaAccao: parsed.data.newValue || null };

  const ok = await patchProjeto(parsed.data.projetoId, patch);
  if (!ok) {
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
