import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getProjetoById, patchProjeto } from "@/lib/mongodb/projetos";
import { logMutation } from "@/lib/mongodb/mutation-audit";
import { sanitizeArquivo, type ProjetoArquivo } from "@/types/projeto";

export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB (PDFs/orçamentos)

// Imagens + documentos comuns (orçamentos, recibos).
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/csv": "csv",
  "text/plain": "txt",
};

function safeName(name: string): string {
  return name.replace(/[\r\n"]/g, "").trim().slice(0, 200) || "ficheiro";
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rl = rateLimit(`upload-arquivo:${ip}`, 30, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many uploads" }, { status: 429 });
  }

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
    return NextResponse.json({ error: "Campo 'file' em falta" }, { status: 400 });
  }

  const ext = EXT_BY_MIME[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: `Tipo não suportado (${file.type || "desconhecido"})` },
      { status: 415 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Ficheiro demasiado grande (${Math.round(file.size / 1024 / 1024)}MB > 10MB)` },
      { status: 413 }
    );
  }

  const projeto = await getProjetoById(projetoId);
  if (!projeto) {
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  }

  const arquivoId = randomUUID();
  const pathname = `projetos/${projetoId}/${arquivoId}.${ext}`;

  let blobUrl: string;
  try {
    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });
    blobUrl = blob.url;
  } catch (err) {
    console.error("Blob put failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload falhou" },
      { status: 500 }
    );
  }

  const arquivo: ProjetoArquivo = {
    id: arquivoId,
    pathname,
    blobUrl, // server-only
    url: `/api/projetos/arquivo/${arquivoId}?projetoId=${projetoId}`,
    nome: safeName(file.name),
    tamanho: file.size,
    tipo: file.type,
    dataUpload: new Date().toISOString(),
  };

  const arquivos = [...(projeto.arquivos ?? []), arquivo];
  const ok = await patchProjeto(projetoId, { arquivos });
  if (!ok) {
    return NextResponse.json({ error: "Falha ao guardar no projeto" }, { status: 500 });
  }

  await logMutation({
    collection: "projetos",
    entityId: projetoId,
    op: "update",
    userEmail: session.user.email ?? null,
    after: { arquivoAdicionado: { id: arquivoId, nome: arquivo.nome } },
  });

  revalidatePath(`/painel/projetos/${projetoId}`);

  // Devolve sem blobUrl — cliente só vê o proxy.
  return NextResponse.json({ arquivo: sanitizeArquivo(arquivo) });
}
