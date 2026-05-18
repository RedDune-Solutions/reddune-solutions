#!/usr/bin/env node
/**
 * Reddune — Sync APENAS de valorEstimado/valorPago do Obsidian para MongoDB.
 *
 * Regras de segurança (NÃO altera projectos preenchidos):
 *  - Salta projecto que já tem `valorEstimado` definido em DB.
 *  - Salta projecto que já tem ≥1 tarefa associada em DB.
 *  - Patch apenas dos campos `valorEstimado` e `valorPago` — nada mais.
 *
 * Extracção do valor (em ordem):
 *  1. `valor-estimado` / `valor-pago` do frontmatter (se numérico).
 *  2. Linha "Total" em tabela markdown do body.
 *  3. Padrão "Pago N€" no body → valorPago.
 *  4. Soma de números N€ na primeira linha do body se restante falhar.
 *
 * Uso:
 *   DRY_RUN=1 node scripts/sync-obsidian-valores.mjs   (default, só imprime)
 *   APPLY=1   node scripts/sync-obsidian-valores.mjs   (escreve em DB)
 *
 * Env:
 *   OBSIDIAN_VAULT_PATH  Caminho absoluto para o vault
 *   MONGODB_URI          Connection string
 *   MONGODB_DB_NAME      Nome da DB (default "reddune")
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const OBSIDIAN_VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH;
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? "reddune";
const APPLY = process.env.APPLY === "1";

if (!OBSIDIAN_VAULT_PATH) {
  console.error("[valores] OBSIDIAN_VAULT_PATH não definido.");
  process.exit(1);
}
if (!MONGODB_URI) {
  console.error("[valores] MONGODB_URI não definido.");
  process.exit(1);
}

const VAULT_ROOT = path.resolve(OBSIDIAN_VAULT_PATH);
const SCAN_DIRS = [
  "RedDune Solutions (Empresa)/02_Projetos - Clientes",
  "RedDune Solutions (Empresa)/03_Projetos - Internos",
];
const IGNORE_DIRS = new Set(["_anexos", ".trash", ".obsidian", "node_modules"]);

function toNumberOrNull(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[€$\s]/g, "").replace(",", ".");
    const n = Number.parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parsePriceFromBody(body) {
  if (!body) return { estimado: null, pago: null };

  // 1) Tabela: linha que começa por "| Total" ou "| **Total**"
  const totalRow = body.match(/\|\s*\*?\*?Total\*?\*?\s*\|([^|\n]*?)\|/i);
  let estimado = null;
  if (totalRow) {
    const n = totalRow[1].match(/(\d+(?:[.,]\d+)?)/);
    if (n) estimado = parseFloat(n[1].replace(",", "."));
  }

  // 2) "Pago X€"
  let pago = null;
  const pagoMatches = [...body.matchAll(/Pago\s+(\d+(?:[.,]\d+)?)\s*€/gi)];
  if (pagoMatches.length > 0) {
    pago = pagoMatches.reduce((s, m) => s + parseFloat(m[1].replace(",", ".")), 0);
  }

  // 3) Fallback estimado: se há "Pago X€" e nenhum total, assumir estimado = pago
  if (estimado == null && pago != null) {
    estimado = pago;
  }

  // 4) Último fallback: se body curto (1-3 linhas) com 1 único valor "N€"
  if (estimado == null) {
    const linhas = body.split(/\n/).filter((l) => l.trim().length > 0);
    if (linhas.length <= 4) {
      const nums = body.match(/(\d+(?:[.,]\d+)?)\s*€/g);
      if (nums && nums.length === 1) {
        estimado = parseFloat(nums[0].replace(/[€\s]/g, "").replace(",", "."));
      }
    }
  }

  return { estimado, pago };
}

async function walkMarkdown(rootAbs, relPrefix = "") {
  const entries = await readdir(rootAbs, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    if (e.name.startsWith(".") || IGNORE_DIRS.has(e.name)) continue;
    const rel = relPrefix ? `${relPrefix}/${e.name}` : e.name;
    const abs = path.join(rootAbs, e.name);
    if (e.isDirectory()) {
      const nested = await walkMarkdown(abs, rel);
      out.push(...nested);
    } else if (e.isFile() && e.name.toLowerCase().endsWith(".md")) {
      if (e.name.startsWith("Untitled")) continue;
      out.push(rel);
    }
  }
  return out;
}

function normalizeTitle(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function main() {
  console.log(`[valores] vault=${VAULT_ROOT} apply=${APPLY}`);

  // 1) Recolher e parsear obsidian
  const obs = [];
  for (const dir of SCAN_DIRS) {
    const abs = path.join(VAULT_ROOT, dir);
    let files;
    try {
      files = await walkMarkdown(abs);
    } catch (e) {
      console.warn(`[valores] pasta não encontrada: ${dir}`);
      continue;
    }
    for (const rel of files) {
      const full = path.join(abs, rel);
      const raw = await readFile(full, "utf8");
      const m = matter(raw);
      const fm = m.data ?? {};
      if (String(fm["tipo-doc"] ?? "").toLowerCase() !== "projeto") continue;
      const titulo = path.basename(rel, ".md");
      const body = m.content ?? "";

      let estimado = toNumberOrNull(fm["valor-estimado"]);
      let pago = toNumberOrNull(fm["valor-pago"]);

      if (estimado == null || pago == null) {
        const fromBody = parsePriceFromBody(body);
        if (estimado == null) estimado = fromBody.estimado;
        if (pago == null) pago = fromBody.pago;
      }

      obs.push({ titulo, normalized: normalizeTitle(titulo), estimado, pago });
    }
  }
  console.log(`[valores] obsidian projetos parsed=${obs.length}`);

  // 2) DB: ler projetos + tarefas
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB_NAME);
  const projCol = db.collection("projetos");
  const tarefasCol = db.collection("tarefas");

  const projetos = await projCol.find({}, { projection: { _id: 0 } }).toArray();
  console.log(`[valores] DB projetos=${projetos.length}`);

  const projetoIdsComTarefas = new Set(
    (await tarefasCol.distinct("projetoId")) ?? []
  );
  console.log(`[valores] DB projetos com ≥1 tarefa=${projetoIdsComTarefas.size}`);

  // 3) Match e filtragem
  const updates = [];
  const skipsPreenchido = [];
  const skipsComTarefas = [];
  const skipsSemValor = [];
  const naoMatched = [];

  for (const o of obs) {
    if (o.estimado == null && o.pago == null) {
      skipsSemValor.push(o.titulo);
      continue;
    }
    const match = projetos.find((p) => normalizeTitle(p.titulo) === o.normalized);
    if (!match) {
      naoMatched.push(o.titulo);
      continue;
    }
    if (match.valorEstimado != null) {
      skipsPreenchido.push(`${o.titulo} (DB=${match.valorEstimado}€)`);
      continue;
    }
    if (projetoIdsComTarefas.has(match.id)) {
      skipsComTarefas.push(o.titulo);
      continue;
    }
    const patch = {};
    if (o.estimado != null) patch.valorEstimado = o.estimado;
    if (o.pago != null) patch.valorPago = o.pago;
    updates.push({ id: match.id, titulo: match.titulo, patch });
  }

  console.log(`\n[valores] === relatório ===`);
  console.log(`updates planeados: ${updates.length}`);
  console.log(`skipped (já preenchido): ${skipsPreenchido.length}`);
  console.log(`skipped (tem tarefas):   ${skipsComTarefas.length}`);
  console.log(`skipped (sem valor):     ${skipsSemValor.length}`);
  console.log(`não match (sem projecto DB): ${naoMatched.length}`);

  if (updates.length > 0) {
    console.log(`\n--- updates ---`);
    for (const u of updates) {
      console.log(
        `  ${u.titulo}  →  estimado=${u.patch.valorEstimado ?? "—"}, pago=${u.patch.valorPago ?? "—"}`
      );
    }
  }
  if (skipsPreenchido.length > 0) {
    console.log(`\n--- skipped (já preenchido) ---`);
    for (const t of skipsPreenchido) console.log(`  ${t}`);
  }
  if (skipsComTarefas.length > 0) {
    console.log(`\n--- skipped (tem tarefas) ---`);
    for (const t of skipsComTarefas) console.log(`  ${t}`);
  }
  if (skipsSemValor.length > 0) {
    console.log(`\n--- skipped (sem valor no obsidian) ---`);
    for (const t of skipsSemValor) console.log(`  ${t}`);
  }
  if (naoMatched.length > 0) {
    console.log(`\n--- não match (sem projecto DB) ---`);
    for (const t of naoMatched) console.log(`  ${t}`);
  }

  if (!APPLY) {
    console.log(`\n[valores] DRY RUN — nenhuma escrita. Corre com APPLY=1 para aplicar.`);
    await client.close();
    return;
  }

  console.log(`\n[valores] A aplicar ${updates.length} updates…`);
  let ok = 0;
  let fail = 0;
  for (const u of updates) {
    try {
      const r = await projCol.updateOne({ id: u.id }, { $set: u.patch });
      if (r.matchedCount > 0) {
        ok += 1;
        console.log(`  ✓ ${u.titulo}`);
      } else {
        fail += 1;
        console.log(`  ✗ ${u.titulo} (matchedCount=0)`);
      }
    } catch (e) {
      fail += 1;
      console.log(`  ✗ ${u.titulo}: ${e.message}`);
    }
  }
  console.log(`\n[valores] feito: ${ok} ok / ${fail} fail`);
  await client.close();
}

main().catch((e) => {
  console.error("[valores] erro:", e);
  process.exit(1);
});
