import { NextResponse } from "next/server";
import { getSandboxById } from "@/lib/mongodb/portal-sandbox";
import { getProjetoById } from "@/lib/mongodb/projetos";
import { rateLimitDistributed, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string; path?: string[] }>;

// Serve ficheiros de um sandbox (projeto multi-ficheiro) hospedado no site.
// Auth = capability `id` (não o token do portal — leaks só expõem este design).
// O sandbox só serve se o projeto tiver portal ACTIVO (revogar corta o acesso).
export async function GET(request: Request, { params }: { params: Params }) {
  const ip = getClientIp(request);
  // Generoso: uma página de protótipo carrega dezenas de assets de uma vez.
  const rl = await rateLimitDistributed(`sandbox-serve:${ip}`, 600, 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { id, path } = await params;

  const sandbox = await getSandboxById(id);
  if (!sandbox) return new NextResponse("Não encontrado", { status: 404 });

  // Revogar o portal do projeto corta também os sandboxes.
  const projeto = await getProjetoById(sandbox.projetoId);
  if (!projeto?.portal || projeto.portal.revogadoEm) {
    return new NextResponse("Não encontrado", { status: 404 });
  }

  // Caminho pedido (sem query). Vazio → entry. Só servimos paths do manifest
  // (match exacto) → path traversal impossível. Encoding inválido → 404 (não 500).
  let requested: string;
  try {
    requested = (path ?? []).map((s) => decodeURIComponent(s)).join("/") || sandbox.entry;
  } catch {
    return new NextResponse("Não encontrado", { status: 404 });
  }
  const file = sandbox.ficheiros.find((f) => f.path === requested);
  if (!file) return new NextResponse("Não encontrado", { status: 404 });

  let upstream: Response;
  try {
    upstream = await fetch(file.blobUrl, { cache: "no-store" });
  } catch {
    return new NextResponse("Falha ao obter ficheiro", { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Falha ao obter ficheiro", { status: 502 });
  }

  const headers = new Headers();
  headers.set("Content-Type", file.mime || "application/octet-stream");
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Robots-Tag", "noindex, nofollow");
  headers.set("X-Content-Type-Options", "nosniff");
  // CSP `sandbox` em TODAS as respostas (não só .html): um SVG, XML ou HTML
  // navegado top-level executa scripts; sem este header corria na ORIGEM REAL
  // reddune (XSS). Com ele, qualquer documento do sandbox tem origem OPACA —
  // isolado de cookies/DOM/storage do site. Sem allow-same-origin (isolado), sem
  // allow-top-navigation (não sequestra o separador), sem allow-popups (sem
  // janelas p/ phishing). Nos subrecursos (css/js/img carregados pelo HTML) o
  // directive `sandbox` é inócuo (só afecta documentos), por isso não parte nada.
  headers.set("Content-Security-Policy", "sandbox allow-scripts allow-forms allow-modals");

  return new NextResponse(upstream.body, { status: 200, headers });
}
