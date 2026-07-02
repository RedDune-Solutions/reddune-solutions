import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { upsertProjetoTipoCustom } from "@/lib/mongodb/projeto-tipos-custom";
import { logMutation } from "@/lib/mongodb/mutation-audit";
import { SERVICO_SLUG } from "@/types/servico";

export const dynamic = "force-dynamic";

const schema = z.object({
  id: z.string().min(1).max(128).optional(),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  label: z.string().min(1).max(100),
  categoria: z.enum(SERVICO_SLUG),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
    }
    const { id, ...rest } = parsed.data;
    const tipo = { id: id ?? `tipo_${Date.now()}`, criadoEm: new Date().toISOString(), ...rest };
    await upsertProjetoTipoCustom(tipo);

    await logMutation({
      collection: "projeto_tipos_custom",
      entityId: tipo.id,
      op: id ? "update" : "create",
      userEmail: session.user.email ?? null,
      after: tipo,
    });

    revalidatePath("/painel/definicoes");
    return NextResponse.json(tipo);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
