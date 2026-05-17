import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { upsertPagamento } from "@/lib/mongodb/pagamentos";
import { getProjetoById } from "@/lib/mongodb/projetos";
import { METODO_PAGAMENTO, type Pagamento } from "@/types/pagamento";

export const dynamic = "force-dynamic";

const schema = z.object({
  id: z.string().max(128).optional(),
  projetoId: z.string().min(1).max(128),
  valor: z.number().finite().min(0),
  data: z.string().min(1),
  metodo: z.enum(METODO_PAGAMENTO).nullish(),
  notas: z.string().max(2000).nullish(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const input = parsed.data;
  const projeto = await getProjetoById(input.projetoId);
  if (!projeto) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

  const id = input.id ?? randomUUID();
  const pagamento: Pagamento = {
    id,
    projetoId: input.projetoId,
    clienteId: projeto.clienteId ?? null,
    valor: input.valor,
    data: input.data,
    metodo: input.metodo ?? null,
    notas: input.notas ?? null,
    criadoEm: new Date().toISOString(),
  };

  await upsertPagamento(pagamento);
  return NextResponse.json({ ok: true, id });
}
