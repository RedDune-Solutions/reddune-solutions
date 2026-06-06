import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getProjetoById, patchProjeto } from "@/lib/mongodb/projetos";
import { logMutation } from "@/lib/mongodb/mutation-audit";
import { deleteManagedBlob } from "@/lib/blob";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

function isImage(tipo: string): boolean {
  return tipo.startsWith("image/");
}

export async function GET(request: Request, { params }: { params: Params }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const projetoId = new URL(request.url).searchParams.get("projetoId");
  if (!projetoId) {
    return NextResponse.json({ error: "projetoId em falta" }, { status: 400 });
  }

  const projeto = await getProjetoById(projetoId);
  const arquivo = projeto?.arquivos?.find((a) => a.id === id);
  if (!arquivo?.blobUrl) {
    return NextResponse.json({ error: "Ficheiro não encontrado" }, { status: 404 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(arquivo.blobUrl, { cache: "no-store" });
  } catch {
    return NextResponse.json({ error: "Falha ao obter ficheiro" }, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Falha ao obter ficheiro" }, { status: 502 });
  }

  // Imagens são servidas inline (preview); resto como anexo.
  const disposition = isImage(arquivo.tipo) ? "inline" : "attachment";
  const headers = new Headers();
  headers.set("Content-Type", arquivo.tipo || "application/octet-stream");
  headers.set(
    "Content-Disposition",
    `${disposition}; filename="${encodeURIComponent(arquivo.nome)}"`
  );
  headers.set("Cache-Control", "private, no-store");

  return new NextResponse(upstream.body, { status: 200, headers });
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const projetoId = new URL(request.url).searchParams.get("projetoId");
  if (!projetoId) {
    return NextResponse.json({ error: "projetoId em falta" }, { status: 400 });
  }

  const projeto = await getProjetoById(projetoId);
  if (!projeto) {
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  }

  const arquivo = projeto.arquivos?.find((a) => a.id === id);
  if (!arquivo) {
    return NextResponse.json({ error: "Ficheiro não encontrado" }, { status: 404 });
  }

  const arquivos = (projeto.arquivos ?? []).filter((a) => a.id !== id);
  const ok = await patchProjeto(projetoId, { arquivos });
  if (!ok) {
    return NextResponse.json({ error: "Falha ao actualizar projeto" }, { status: 500 });
  }

  if (arquivo.blobUrl) {
    await deleteManagedBlob(arquivo.blobUrl);
  }

  await logMutation({
    collection: "projetos",
    entityId: projetoId,
    op: "update",
    userEmail: session.user.email ?? null,
    after: { arquivoRemovido: { id, nome: arquivo.nome } },
  });

  revalidatePath(`/painel/projetos/${projetoId}`);

  return NextResponse.json({ ok: true });
}
