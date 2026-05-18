import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import clientPromise from "@/lib/mongodb/client";
import type { Projeto } from "@/types/projeto";
import type { Cliente } from "@/types/cliente";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

/**
 * One-time migration: copies old "tarefas" collection → new "projetos" collection,
 * and old flexible "clientes" collection → new typed "clientes" collection.
 * Safe to run multiple times (upsert by id).
 */
export async function POST(_request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.ALLOW_MIGRATIONS !== "1") {
    return NextResponse.json({ error: "Migrations disabled" }, { status: 403 });
  }

  try {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME);

  // --- Migrate tarefas → projetos ---
  const oldTarefas = await db
    .collection("tarefas")
    .find({}, { projection: { _id: 0 } })
    .toArray();

  const oldClientes = await db
    .collection("clientes")
    .find({}, { projection: { _id: 0 } })
    .toArray();

  // Build a map of nome → id for client linking
  const clienteNomeToId = new Map<string, string>();

  // First pass: migrate clientes
  const projetosCol = db.collection<Projeto>("projetos");
  const clientesCol = db.collection<Cliente>("clientes");

  let clientesMigrated = 0;
  let clientesSkipped = 0;

  for (const c of oldClientes) {
    const nome = String(c.nome ?? "").trim();
    if (!nome) { clientesSkipped++; continue; }

    const id = randomUUID();
    clienteNomeToId.set(nome.toLowerCase(), id);

    const cliente: Cliente = {
      id,
      nome,
      email: typeof c.email === "string" ? c.email : null,
      telefone: typeof c.telefone === "string" ? c.telefone : null,
      nif: c.nif != null ? String(c.nif) : null,
      morada: typeof c.morada === "string" ? c.morada : null,
      notas: typeof c.bodyMd === "string" ? c.bodyMd : null,
      criadoEm: new Date().toISOString(),
    };

    await clientesCol.updateOne({ id }, { $set: cliente }, { upsert: true });
    clientesMigrated++;
  }

  await clientesCol.createIndex({ id: 1 }, { unique: true });

  // Second pass: migrate tarefas → projetos
  let projetosMigrated = 0;

  for (const t of oldTarefas) {
    const clienteNome = typeof t.cliente === "string" ? t.cliente.trim() : null;
    const clienteId = clienteNome
      ? (clienteNomeToId.get(clienteNome.toLowerCase()) ?? null)
      : null;

    const projeto: Projeto = {
      id: String(t.id ?? randomUUID()),
      titulo: String(t.titulo ?? "Sem título"),
      clienteId,
      clienteNome,
      proximaAccao: typeof t.proximaAccao === "string" ? t.proximaAccao : null,
      status: t.status ?? "proximo",
      categoria: null,
      tipo: t.tipo ?? null,
      responsavel: t.responsavel ?? null,
      prazo: typeof t.prazo === "string" ? t.prazo : null,
      dataCriado: typeof t.dataCriado === "string" ? t.dataCriado : null,
      dataFechado: typeof t.dataFechado === "string" ? t.dataFechado : null,
      valorEstimado: typeof t.valorEstimado === "number" ? t.valorEstimado : null,
      valorPago: typeof t.valorPago === "number" ? t.valorPago : null,
      metodoPagamento: typeof t.metodoPagamento === "string" ? t.metodoPagamento : null,
      local: t.local ?? null,
      notasResumo: typeof t.notasResumo === "string" ? t.notasResumo : null,
      bodyMd: typeof t.bodyMd === "string" ? t.bodyMd : null,
      linhas: null,
      garantiaAte: null,
      tipos: t.tipo ? [t.tipo] : null,
      hardware: null,
    };

    await projetosCol.updateOne({ id: projeto.id }, { $set: projeto }, { upsert: true });
    projetosMigrated++;
  }

  await projetosCol.createIndex({ id: 1 }, { unique: true });
  await projetosCol.createIndex({ clienteId: 1 });
  await projetosCol.createIndex({ status: 1 });

  return NextResponse.json({
    ok: true,
    projetos: { migrated: projetosMigrated },
    clientes: { migrated: clientesMigrated, skipped: clientesSkipped },
  });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
