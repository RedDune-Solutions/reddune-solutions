import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllProjetos, upsertProjeto } from "@/lib/mongodb/projetos";
import { TIPO_TO_CATEGORIA, type Projeto } from "@/types/projeto";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projetos = await getAllProjetos();
  let migrated = 0;

  for (const p of projetos) {
    if (p.categoria != null) continue;
    if (p.tipo == null) continue;
    const next = TIPO_TO_CATEGORIA[p.tipo];
    if (next == null) continue;
    const updated: Projeto = { ...p, categoria: next };
    await upsertProjeto(updated);
    migrated += 1;
  }

  return NextResponse.json({ ok: true, migrated, total: projetos.length });
}
