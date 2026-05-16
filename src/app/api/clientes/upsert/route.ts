import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { upsertCliente } from "@/lib/mongodb/clientes";
import { clienteInputSchema } from "@/lib/validation-projeto";
import type { Cliente } from "@/types/cliente";

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

  const parsed = clienteInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const id = input.id ?? randomUUID();
  const now = new Date().toISOString();

  const cliente: Cliente = {
    id,
    nome: input.nome,
    email: input.email ?? null,
    telefone: input.telefone ?? null,
    nif: input.nif ?? null,
    morada: input.morada ?? null,
    notas: input.notas ?? null,
    criadoEm: input.criadoEm ?? now,
  };

  await upsertCliente(cliente);
  return NextResponse.json({ ok: true, id });
}
