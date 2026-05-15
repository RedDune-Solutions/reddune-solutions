#!/usr/bin/env node
/**
 * Reddune — Obsidian → Site sync
 *
 * Lê o vault Obsidian local, extrai projectos (`tipo-doc: projeto`),
 * filtra campos sensíveis e envia snapshot para o site via POST autenticado.
 *
 * Uso:
 *   node scripts/sync-obsidian.mjs
 *
 * Variáveis de ambiente esperadas (carrega de scripts/.env via dotenv ou via shell):
 *   OBSIDIAN_VAULT_PATH  Caminho absoluto para o vault Obsidian
 *   SITE_URL             URL base do site (ex: http://localhost:9002 ou https://reddune.solutions)
 *   SYNC_SECRET          Token Bearer (mesmo que está em /api/tarefas no servidor)
 *   DRY_RUN              "1" para apenas mostrar payload sem POST
 */

import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const OBSIDIAN_VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH;
const SITE_URL = process.env.SITE_URL ?? "http://localhost:9002";
const SYNC_SECRET = process.env.SYNC_SECRET;
const DRY_RUN = process.env.DRY_RUN === "1";

if (!OBSIDIAN_VAULT_PATH) {
  console.error("[sync-obsidian] OBSIDIAN_VAULT_PATH não definido. Cria scripts/.env a partir de scripts/.env.example.");
  process.exit(1);
}

const VAULT_ROOT = path.resolve(OBSIDIAN_VAULT_PATH);
const SCAN_DIRS = [
  "RedDune Solutions (Empresa)/02_Projetos - Clientes",
  "RedDune Solutions (Empresa)/03_Projetos - Internos",
];

const FICHA_DIRS = {
  clientes: "RedDune Solutions (Empresa)/01_Clientes (Fichas)",
  parceiros: "RedDune Solutions (Empresa)/04_Parceiros (Fichas)",
};

const STATUS_NORMALIZE = {
  "próximo": "proximo",
  "proximo": "proximo",
  "em-curso": "em-curso",
  "aguarda-cliente": "aguarda-cliente",
  "aguarda-peças": "aguarda-pecas",
  "aguarda-pecas": "aguarda-pecas",
  "aguarda-fornecedor": "aguarda-fornecedor",
  "pronto": "pronto",
  "fechado": "fechado",
  "cancelado": "cancelado",
  "garantia": "garantia",
  "suspenso": "suspenso",
  "bloqueado": "bloqueado",
  "em-divida": "em-divida",
  "em-dívida": "em-divida",
};

const TIPO_NORMALIZE = {
  "diagnóstico": "diagnostico",
  "diagnostico": "diagnostico",
  "montagem": "montagem",
  "formatação": "formatacao",
  "formatacao": "formatacao",
  "reparação": "reparacao",
  "reparacao": "reparacao",
  "acessórios": "acessorios",
  "acessorios": "acessorios",
  "web": "web",
  "app": "app",
  "automação": "automacao",
  "automacao": "automacao",
  "marketing": "marketing",
  "consultoria": "consultoria",
  "formação": "formacao",
  "formacao": "formacao",
  "redes-sociais": "redes-sociais",
  "intermediação": "intermediacao",
  "intermediacao": "intermediacao",
  "outro": "outro",
};

const VALID_RESPONSAVEL = new Set(["eu", "cliente", "fornecedor"]);

function hashId(input) {
  return createHash("sha1").update(input).digest("hex").slice(0, 16);
}

function resolveWikilink(value) {
  if (typeof value !== "string") return null;
  const m = value.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
  if (m) {
    const target = m[1].trim();
    return target.length > 0 ? target : null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toIsoDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    // Already ISO-ish
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString().slice(0, 10);
    }
  }
  return null;
}

function toNumberOrNull(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[€$\s]/g, "").replace(",", ".");
    const n = Number.parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function summarizeBody(body, maxLen = 200) {
  if (!body) return null;
  // Strip frontmatter dividers, headings, callouts
  const stripped = body
    .replace(/^>.*$/gm, "")
    .replace(/^#+\s*/gm, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, p1, p2) => p2 ?? p1)
    .replace(/\s+/g, " ")
    .trim();
  if (stripped.length === 0) return null;
  return stripped.length > maxLen ? `${stripped.slice(0, maxLen - 1)}…` : stripped;
}

function pasta(relativePath) {
  if (relativePath.includes("02_Projetos - Clientes")) return "clientes";
  if (relativePath.includes("03_Projetos - Internos")) return "internos";
  return null;
}

function parseProject(relPath, fileContent) {
  const parsed = matter(fileContent);
  const fm = parsed.data ?? {};

  const tipoDoc = String(fm["tipo-doc"] ?? "").toLowerCase();
  if (tipoDoc !== "projeto" && tipoDoc !== "projeto-interno") return null;

  const rawStatus = String(fm.status ?? "").trim().toLowerCase();
  const status = STATUS_NORMALIZE[rawStatus] ?? null;
  if (!status) return null;

  const folder = pasta(relPath);
  if (!folder) return null;

  const titulo = path.basename(relPath, ".md");
  const id = hashId(relPath);

  const rawTipo = String(fm.tipo ?? "").trim().toLowerCase();
  const tipo = TIPO_NORMALIZE[rawTipo] ?? null;

  const rawResponsavel = String(fm.responsável ?? fm.responsavel ?? "").trim().toLowerCase();
  const responsavel = VALID_RESPONSAVEL.has(rawResponsavel) ? rawResponsavel : null;

  return {
    id,
    titulo,
    cliente: resolveWikilink(fm.cliente),
    proximaAccao: typeof (fm["próxima-acção"] ?? fm["proxima-accao"]) === "string"
      ? String(fm["próxima-acção"] ?? fm["proxima-accao"]).trim() || null
      : null,
    status,
    tipo,
    responsavel,
    prazo: toIsoDate(fm["data-prevista"]),
    dataCriado: toIsoDate(fm["data-criado"]),
    valorEstimado: toNumberOrNull(fm["valor-estimado"]),
    notasResumo: summarizeBody(parsed.content),
    pasta: folder,
    sourcePath: relPath.replace(/\\/g, "/"),
  };
}

function parseFicha(relPath, fileContent) {
  const parsed = matter(fileContent);
  const fm = parsed.data ?? {};
  const sanitized = Object.fromEntries(
    Object.entries(fm).map(([k, v]) => [
      k,
      v instanceof Date ? v.toISOString().slice(0, 10) : v,
    ])
  );
  return {
    ...sanitized,
    sourcePath: relPath.replace(/\\/g, "/"),
  };
}

const IGNORE_DIRS = new Set(["_anexos", ".trash", ".obsidian", "node_modules"]);

async function walkMarkdown(rootAbs, relPrefix = "") {
  const entries = await readdir(rootAbs, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (IGNORE_DIRS.has(entry.name)) continue;
    const relPath = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
    const absPath = path.join(rootAbs, entry.name);
    if (entry.isDirectory()) {
      const nested = await walkMarkdown(absPath, relPath);
      results.push(...nested);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      if (entry.name.startsWith("Untitled")) continue;
      results.push(relPath);
    }
  }
  return results;
}

async function collectMarkdown() {
  const all = [];
  for (const dir of SCAN_DIRS) {
    const abs = path.join(VAULT_ROOT, dir);
    try {
      const files = await walkMarkdown(abs);
      for (const rel of files) {
        all.push(`${dir}/${rel}`);
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        console.warn(`[sync-obsidian] pasta não encontrada: ${dir}`);
      } else {
        throw error;
      }
    }
  }
  return all;
}

async function collectFichas(dirKey) {
  const dir = FICHA_DIRS[dirKey];
  const abs = path.join(VAULT_ROOT, dir);
  const fichas = [];
  let files;
  try {
    files = await walkMarkdown(abs);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.warn(`[sync-obsidian] pasta fichas não encontrada: ${dir}`);
      return [];
    }
    throw error;
  }
  for (const rel of files) {
    const fullRel = `${dir}/${rel}`;
    try {
      const content = await readFile(path.join(VAULT_ROOT, fullRel), "utf8");
      fichas.push(parseFicha(fullRel, content));
    } catch (error) {
      console.warn(`[sync-obsidian] ignorado ficha ${fullRel}: ${error.message}`);
    }
  }
  return fichas;
}

async function main() {
  console.log(`[sync-obsidian] Vault: ${VAULT_ROOT}`);
  const relPaths = await collectMarkdown();
  console.log(`[sync-obsidian] ${relPaths.length} ficheiros .md encontrados`);

  const tarefas = [];
  let skipped = 0;
  for (const rel of relPaths) {
    try {
      const abs = path.join(VAULT_ROOT, rel);
      const content = await readFile(abs, "utf8");
      const parsed = parseProject(rel, content);
      if (parsed) {
        tarefas.push(parsed);
      } else {
        skipped++;
      }
    } catch (error) {
      console.warn(`[sync-obsidian] ignorado ${rel}: ${error.message}`);
      skipped++;
    }
  }

  const summary = {
    total: tarefas.length,
    clientes: tarefas.filter((t) => t.pasta === "clientes").length,
    internos: tarefas.filter((t) => t.pasta === "internos").length,
    porStatus: tarefas.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1;
      return acc;
    }, {}),
  };

  console.log(`[sync-obsidian] ${tarefas.length} tarefas para sync (${skipped} ignorados)`);
  console.log(`  - Clientes: ${summary.clientes}, Internos: ${summary.internos}`);
  console.log(`  - Por status:`, summary.porStatus);

  // ── Fichas ────────────────────────────────────────────────────────────────
  const [clientesFichas, parceirosFichas] = await Promise.all([
    collectFichas("clientes"),
    collectFichas("parceiros"),
  ]);
  console.log(
    `[sync-obsidian] ${clientesFichas.length} fichas de clientes, ${parceirosFichas.length} fichas de parceiros`
  );

  if (DRY_RUN) {
    console.log("[sync-obsidian] DRY_RUN=1 — não envia POST. Primeiras 3 tarefas:");
    console.log(JSON.stringify(tarefas.slice(0, 3), null, 2));
    console.log("[sync-obsidian] Primeiras 2 fichas de clientes:");
    console.log(JSON.stringify(clientesFichas.slice(0, 2), null, 2));
    return;
  }

  if (!SYNC_SECRET) {
    console.error("[sync-obsidian] SYNC_SECRET não definido. Define em scripts/.env.");
    process.exit(1);
  }

  // ── POST tarefas ──────────────────────────────────────────────────────────
  const endpoint = `${SITE_URL.replace(/\/$/, "")}/api/tarefas`;
  console.log(`[sync-obsidian] POST ${endpoint}`);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SYNC_SECRET}`,
    },
    body: JSON.stringify({ tarefas }),
  });

  const text = await response.text();
  if (!response.ok) {
    console.error(`[sync-obsidian] HTTP ${response.status}: ${text}`);
    process.exit(1);
  }

  console.log(`[sync-obsidian] OK: ${text}`);

  // ── POST fichas ───────────────────────────────────────────────────────────
  const syncEndpoint = `${SITE_URL.replace(/\/$/, "")}/api/sync`;
  console.log(`[sync-obsidian] POST ${syncEndpoint}`);

  const syncResp = await fetch(syncEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SYNC_SECRET}`,
    },
    body: JSON.stringify({ clientes: clientesFichas, parceiros: parceirosFichas }),
  });

  const syncText = await syncResp.text();
  if (!syncResp.ok) {
    console.error(`[sync-obsidian] sync HTTP ${syncResp.status}: ${syncText}`);
    process.exit(1);
  }

  console.log(`[sync-obsidian] sync OK: ${syncText}`);
}

main().catch((error) => {
  console.error("[sync-obsidian] erro fatal:", error);
  process.exit(1);
});
