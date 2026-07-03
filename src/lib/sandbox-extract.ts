import { unzipSync } from "fflate";
import { mimeForPath, isHtmlPath } from "./sandbox-mime";

export class SandboxError extends Error {}

export type ExtractedFile = { path: string; bytes: Uint8Array; mime: string };
export type ExtractResult = { entry: string; files: ExtractedFile[] };

export type ExtractLimits = {
  maxFiles?: number;
  maxTotalBytes?: number;
  maxFileBytes?: number;
};

const DEFAULTS: Required<ExtractLimits> = {
  maxFiles: 300,
  maxTotalBytes: 60 * 1024 * 1024, // 60MB descomprimido
  maxFileBytes: 15 * 1024 * 1024, // 15MB por ficheiro
};

// Ficheiros de sistema que não fazem parte do site.
function isJunk(path: string): boolean {
  return (
    path.startsWith("__MACOSX/") ||
    path.endsWith("/.DS_Store") ||
    path === ".DS_Store" ||
    /(^|\/)Thumbs\.db$/i.test(path)
  );
}

/**
 * Normaliza e valida um caminho de entrada do zip. Lança em path traversal ou
 * caminho absoluto (defesa contra escrever/servir fora do sandbox). Devolve o
 * caminho lógico com "/" ou null se for uma entrada de diretório (a ignorar).
 */
function safePath(raw: string): string | null {
  const p = raw.replace(/\\/g, "/");
  if (p.endsWith("/")) return null; // entrada de diretório
  if (p.startsWith("/")) throw new SandboxError(`Caminho absoluto não permitido: ${raw}`);
  const segments = p.split("/");
  if (segments.some((s) => s === ".." || s === ".")) {
    throw new SandboxError(`Caminho inválido: ${raw}`);
  }
  return segments.filter(Boolean).join("/");
}

/**
 * Se TODOS os ficheiros partilham a mesma pasta-raiz (ex.: "meu-site/…"),
 * descasca-a — os zips de projeto costumam vir com uma pasta a envolver tudo.
 */
function stripCommonRoot(paths: string[]): (p: string) => string {
  if (paths.length === 0) return (p) => p;
  const first = paths[0]!.split("/")[0];
  if (!first) return (p) => p;
  const allShare = paths.every((p) => p.startsWith(first + "/"));
  if (!allShare) return (p) => p;
  const prefix = first + "/";
  return (p) => (p.startsWith(prefix) ? p.slice(prefix.length) : p);
}

export function extractSandbox(zip: Uint8Array, limits?: ExtractLimits): ExtractResult {
  const { maxFiles, maxTotalBytes, maxFileBytes } = { ...DEFAULTS, ...limits };

  let unzipped: Record<string, Uint8Array>;
  try {
    unzipped = unzipSync(zip);
  } catch {
    throw new SandboxError("Não foi possível ler o ZIP (ficheiro corrompido ou inválido).");
  }

  // 1) valida caminhos e junta os que interessam
  const raw: { path: string; bytes: Uint8Array }[] = [];
  for (const [name, bytes] of Object.entries(unzipped)) {
    const path = safePath(name); // lança em traversal/absoluto
    if (path === null || isJunk(path)) continue;
    raw.push({ path, bytes });
  }
  if (raw.length === 0) throw new SandboxError("O ZIP não tem ficheiros válidos.");

  // 2) descasca pasta-raiz comum
  const strip = stripCommonRoot(raw.map((r) => r.path));

  // 3) aplica limites + constrói a lista
  let total = 0;
  const files: ExtractedFile[] = [];
  for (const { path: rawPath, bytes } of raw) {
    const path = strip(rawPath);
    if (!path) continue;
    if (bytes.length > maxFileBytes) {
      throw new SandboxError(`Ficheiro demasiado grande: ${path} (máx ${maxFileBytes / 1024 / 1024}MB).`);
    }
    total += bytes.length;
    if (total > maxTotalBytes) {
      throw new SandboxError(`Projeto demasiado grande (máx ${maxTotalBytes / 1024 / 1024}MB descomprimido).`);
    }
    files.push({ path, bytes, mime: mimeForPath(path) });
    if (files.length > maxFiles) {
      throw new SandboxError(`Demasiados ficheiros (máx ${maxFiles}).`);
    }
  }

  // 4) entry: index.html na raiz > primeiro index.html > primeiro .html
  const htmls = files.filter((f) => isHtmlPath(f.path));
  if (htmls.length === 0) {
    throw new SandboxError("O projeto não tem nenhum ficheiro .html para abrir.");
  }
  const entry =
    htmls.find((f) => f.path === "index.html")?.path ??
    htmls.find((f) => f.path.endsWith("/index.html"))?.path ??
    htmls[0]!.path;

  return { entry, files };
}
