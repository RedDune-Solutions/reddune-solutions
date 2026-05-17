import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllProjetos, upsertProjeto } from "@/lib/mongodb/projetos";
import type { Projeto, ProjetoStatus } from "@/types/projeto";

export const dynamic = "force-dynamic";

const MAP: Record<string, ProjetoStatus> = {
  "aguarda-cliente": "aguardando-cliente",
  "aguarda-pecas": "aguardando-encomenda",
  "aguarda-fornecedor": "aguardando-encomenda",
  suspenso: "aguardando-encomenda",
  bloqueado: "aguardando-encomenda",
  pronto: "terminado",
  entregue: "terminado",
  "em-divida": "terminado",
  garantia: "fechado",
  aguardando: "aguardando-encomenda",
};

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projetos = await getAllProjetos();
  let migrated = 0;

  for (const p of projetos) {
    const old = p.status as string;
    const next = MAP[old];
    if (!next) continue;
    const updated: Projeto = { ...p, status: next };
    if (old === "garantia" && !p.garantiaAte) {
      updated.garantiaAte = addDays(p.dataFechado ?? p.dataCriado ?? new Date().toISOString().slice(0, 10), 90);
    }
    await upsertProjeto(updated);
    migrated += 1;
  }

  return NextResponse.json({ ok: true, migrated, total: projetos.length });
}
