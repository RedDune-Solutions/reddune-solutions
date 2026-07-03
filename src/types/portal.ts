/** Um ficheiro dentro de um sandbox (projeto multi-ficheiro hospedado no site). */
export interface SandboxFile {
  path: string; // caminho lógico normalizado (ex.: "assets/logo.png"), sem "../"
  blobUrl: string; // URL cru do Vercel Blob — APENAS server-side
  mime: string;
  tamanho: number;
}

/**
 * Sandbox = projeto web multi-ficheiro (index.html + css/js/imagens/subpáginas)
 * hospedado no próprio site, servido pelo proxy. O `id` é uma CAPABILITY própria
 * (não o token do portal) — quem o tem vê só este conteúdo de design.
 */
export interface PortalSandbox {
  id: string; // capability aleatória (32B base64url)
  projetoId: string;
  nome: string;
  entry: string; // ficheiro de entrada (normalmente "index.html")
  ficheiros: SandboxFile[];
  criadoEm: string; // ISO
}

export interface PortalComentario {
  id: string;
  projetoId: string;
  arquivoId: string | null; // null = comentário geral (ou de um link/sandbox)
  linkId: string | null;
  sandboxId: string | null;
  autorNome: string | null;
  texto: string;
  criadoEm: string; // ISO
  lidoEm: string | null; // marcado lido no painel
  ip: string;
}
