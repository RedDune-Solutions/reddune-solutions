import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertServicoCategoria } from "@/lib/mongodb/servico-categorias";

export const dynamic = "force-dynamic";

const schema = z.object({
  id: z.string().min(1).max(128).optional(),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  label: z.string().min(1).max(100),
  ordem: z.number().int().default(99),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
    }
    const { id, ...rest } = parsed.data;
    const categoria = {
      id: id ?? `cat_${Date.now()}`,
      criadoEm: new Date().toISOString(),
      ...rest,
    };
    await upsertServicoCategoria(categoria);
    return NextResponse.json(categoria);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
