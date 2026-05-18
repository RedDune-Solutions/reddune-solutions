import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllProjetos, upsertProjeto } from "@/lib/mongodb/projetos";
import { TIPO_TO_CATEGORIA, type Projeto } from "@/types/projeto";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (process.env.ALLOW_MIGRATIONS !== "1") {
    return NextResponse.json({ error: "Migrations disabled" }, { status: 403 });
  }

  try {
    const projetos = await getAllProjetos();
    let migrated = 0;

    for (const p of projetos) {
      let next: Projeto = p;
      let changed = false;

      if (p.categoria == null && p.tipo != null) {
        const cat = TIPO_TO_CATEGORIA[p.tipo];
        if (cat != null) {
          next = { ...next, categoria: cat };
          changed = true;
        }
      }
      // Backfill tipos array from single tipo
      if (next.tipos == null && next.tipo != null) {
        next = { ...next, tipos: [next.tipo] };
        changed = true;
      }

      if (changed) {
        await upsertProjeto(next);
        migrated += 1;
      }
    }

    return NextResponse.json({ ok: true, migrated, total: projetos.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
