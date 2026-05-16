import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { upsertNota } from "@/lib/mongodb/notas";
import type { Nota } from "@/types/nota";
import { randomUUID } from "node:crypto";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const now = new Date().toISOString();

  const nota: Nota = {
    id: body.id ?? randomUUID(),
    titulo: String(body.titulo ?? "").trim() || "Sem título",
    corpo: String(body.corpo ?? ""),
    criadoEm: body.criadoEm ?? now,
    atualizadoEm: now,
  };

  await upsertNota(nota);
  return NextResponse.json({ ok: true, id: nota.id });
}
