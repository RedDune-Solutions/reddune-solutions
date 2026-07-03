import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { resolvePortalToken } from "@/lib/portal-auth";
import { comentarioSchema } from "@/lib/validation-portal";
import { insertComentario, countComentariosRecentes } from "@/lib/mongodb/portal";
import { rateLimitDistributed, getClientIp } from "@/lib/rate-limit";
import { sendPushToAll } from "@/lib/push";
import type { PortalComentario } from "@/types/portal";

export const dynamic = "force-dynamic";

// Comentário do cliente no portal. Anti-abuso igual ao formulário de contacto:
// honeypot + rate-limit por IP + tecto por projecto/24h. Notifica por push.
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await rateLimitDistributed(`portal-comentario:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot — bots preenchem tudo. 200 silencioso finge sucesso.
  if (typeof body.website === "string" && body.website !== "") {
    return NextResponse.json({ ok: true });
  }

  const projeto = await resolvePortalToken(body.t);
  if (!projeto) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const parsed = comentarioSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Comentário inválido" }, { status: 400 });

  // Tecto por projecto/24h — trava flood distribuído que o limite por IP não vê.
  if ((await countComentariosRecentes(projeto.id)) >= 50) {
    return NextResponse.json({ error: "Limite de comentários atingido" }, { status: 429 });
  }

  const arquivoId =
    parsed.data.arquivoId && projeto.arquivos?.some((a) => a.id === parsed.data.arquivoId)
      ? parsed.data.arquivoId
      : null;
  const linkId =
    parsed.data.linkId && projeto.links?.some((k) => k.id === parsed.data.linkId)
      ? parsed.data.linkId
      : null;

  const comentario: PortalComentario = {
    id: randomUUID(),
    projetoId: projeto.id,
    arquivoId,
    linkId,
    autorNome: parsed.data.autorNome?.trim() || projeto.clienteNome || null,
    texto: parsed.data.texto,
    criadoEm: new Date().toISOString(),
    lidoEm: null,
    ip,
  };
  await insertComentario(comentario);

  // Push best-effort (mesmo padrão dos leads) — não quebra a resposta.
  try {
    await sendPushToAll({
      title: "💬 Comentário no portal",
      body: `${comentario.autorNome ?? "Cliente"} — ${projeto.titulo}`,
      url: `/painel/projetos/${projeto.id}`,
    });
  } catch (e) {
    console.error("push comentário falhou:", e);
  }

  revalidatePath(`/painel/projetos/${projeto.id}`);
  return NextResponse.json({
    ok: true,
    comentario: { id: comentario.id, texto: comentario.texto, criadoEm: comentario.criadoEm },
  });
}
