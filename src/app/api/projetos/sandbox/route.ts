import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { rateLimitDistributed, getClientIp } from "@/lib/rate-limit";
import { getProjetoById } from "@/lib/mongodb/projetos";
import { insertSandbox } from "@/lib/mongodb/portal-sandbox";
import { extractSandbox, SandboxError } from "@/lib/sandbox-extract";
import { generatePortalToken } from "@/lib/portal-token";
import { deleteManagedBlobs } from "@/lib/blob";
import { logMutation } from "@/lib/mongodb/mutation-audit";
import type { PortalSandbox, SandboxFile } from "@/types/portal";

export const dynamic = "force-dynamic";

const MAX_ZIP_BYTES = 30 * 1024 * 1024; // 30MB comprimido
const PUT_CONCURRENCY = 8;

function safeNome(name: string): string {
  return name.replace(/[\r\n"]/g, "").trim().slice(0, 120) || "Projeto";
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(request);
  const rl = await rateLimitDistributed(`sandbox-upload:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many uploads" }, { status: 429 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Storage não configurado (BLOB_READ_WRITE_TOKEN em falta)" },
      { status: 500 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const projetoId = form.get("projetoId");
  if (typeof projetoId !== "string" || !projetoId) {
    return NextResponse.json({ error: "Campo 'projetoId' em falta" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Campo 'file' (zip) em falta" }, { status: 400 });
  }
  if (file.size > MAX_ZIP_BYTES) {
    return NextResponse.json(
      { error: `ZIP demasiado grande (${Math.round(file.size / 1024 / 1024)}MB > 30MB)` },
      { status: 413 }
    );
  }

  const projeto = await getProjetoById(projetoId);
  if (!projeto) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

  // Extrai + valida (path traversal, limites, deteta entry).
  let extracted;
  try {
    const buf = new Uint8Array(await file.arrayBuffer());
    extracted = extractSandbox(buf);
  } catch (e) {
    if (e instanceof SandboxError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("extractSandbox falhou:", e);
    return NextResponse.json({ error: "Não foi possível processar o ZIP." }, { status: 400 });
  }

  const sandboxId = generatePortalToken(); // capability própria (não o token do portal)
  const uploaded: SandboxFile[] = [];
  // Regista CADA blob assim que sobe (não por lote) — se um put falhar a meio de
  // um lote, os que já subiram nesse lote têm de ser limpos na mesma.
  const allBlobUrls: string[] = [];

  // Uploads em lotes para não abrir centenas de ligações de uma vez.
  try {
    for (let i = 0; i < extracted.files.length; i += PUT_CONCURRENCY) {
      const chunk = extracted.files.slice(i, i + PUT_CONCURRENCY);
      const results = await Promise.all(
        chunk.map(async (f) => {
          const blob = await put(`sandboxes/${sandboxId}/${f.path}`, Buffer.from(f.bytes), {
            access: "public",
            contentType: f.mime,
            addRandomSuffix: true,
          });
          allBlobUrls.push(blob.url);
          return { path: f.path, blobUrl: blob.url, mime: f.mime, tamanho: f.bytes.length };
        })
      );
      uploaded.push(...results);
    }
  } catch (err) {
    console.error("sandbox put falhou:", err);
    await deleteManagedBlobs(allBlobUrls);
    return NextResponse.json({ error: "Falha ao guardar os ficheiros." }, { status: 500 });
  }

  const nomeForm = form.get("nome");
  const sandbox: PortalSandbox = {
    id: sandboxId,
    projetoId,
    nome: typeof nomeForm === "string" && nomeForm.trim() ? safeNome(nomeForm) : safeNome(file.name.replace(/\.zip$/i, "")),
    entry: extracted.entry,
    ficheiros: uploaded,
    criadoEm: new Date().toISOString(),
  };

  try {
    await insertSandbox(sandbox);
  } catch (err) {
    console.error("insertSandbox falhou:", err);
    await deleteManagedBlobs(uploaded.map((u) => u.blobUrl));
    return NextResponse.json({ error: "Falha ao registar o projeto." }, { status: 500 });
  }

  await logMutation({
    collection: "projetos",
    entityId: projetoId,
    op: "update",
    userEmail: session.user.email ?? null,
    after: { sandboxAdicionado: { id: sandboxId, nome: sandbox.nome, ficheiros: uploaded.length } },
  });

  revalidatePath(`/painel/projetos/${projetoId}`);

  // Devolve resumo sem blobUrls (server-only).
  return NextResponse.json({
    sandbox: {
      id: sandbox.id,
      nome: sandbox.nome,
      entry: sandbox.entry,
      criadoEm: sandbox.criadoEm,
      totalFicheiros: uploaded.length,
    },
  });
}
