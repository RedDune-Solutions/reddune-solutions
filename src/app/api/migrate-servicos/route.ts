import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/lib/auth";
import { upsertServico } from "@/lib/mongodb/servicos";
import {
  SERVICO_SLUG,
  type Servico,
  type ServicoSlug,
  type VariantePreco,
} from "@/types/servico";

export const dynamic = "force-dynamic";

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").trim();
}

const VARIANTE_LABELS = /(Desktop|Portátil|Portatil|Consola|Office|Gaming|High[- ]?End|High)/i;

/**
 * Extrai min (+ max opcional) de uma string de preço.
 * "20–30€" → { min: 20, max: 30 }. "35€" → { min: 35, max: null }.
 */
function extractPriceRange(s: string): { min: number; max: number | null } | null {
  const nums = s.match(/\d+(?:[.,]\d+)?/g);
  if (!nums || nums.length === 0) return null;
  const parsed = nums.map((n) => parseFloat(n.replace(",", ".")));
  return { min: parsed[0]!, max: parsed.length > 1 ? parsed[1]! : null };
}

/**
 * Tenta dividir uma parte de variante em label + preço (range opcional).
 * "Desktop 20–30€" → { label: "Desktop", preco: 20, precoMax: 30 }
 * "High-End 120–160€" → { label: "High-End", preco: 120, precoMax: 160 }
 */
function parseVariantePart(part: string): VariantePreco | null {
  const trimmed = part.trim();
  const labelMatch = trimmed.match(VARIANTE_LABELS);
  const range = extractPriceRange(trimmed);
  if (range == null) return null;
  const label = labelMatch ? labelMatch[0] : trimmed.replace(/[\d€.,\-–\s]+/g, "").trim();
  if (!label) return null;
  return { label, preco: range.min, precoMax: range.max };
}

interface ParsedPrice {
  precoBase: number | null;
  precoMax?: number | null;
  variantes: VariantePreco[] | null;
  precoTexto: string | null;
  nota: string | null;
}

function parsePrice(raw: string): ParsedPrice {
  const stripped = stripHtml(raw);
  if (!stripped) return { precoBase: null, variantes: null, precoTexto: null, nota: null };

  // Multi-variante: tem labels conhecidas OU múltiplos números com separador "·"
  const hasMultiLabels = VARIANTE_LABELS.test(stripped);
  const partes = stripped.split("·").map((s) => s.trim()).filter(Boolean);

  if (hasMultiLabels && partes.length > 1) {
    const variantes: VariantePreco[] = [];
    for (const p of partes) {
      const v = parseVariantePart(p);
      if (v) variantes.push(v);
    }
    if (variantes.length > 0) {
      return { precoBase: null, variantes, precoTexto: null, nota: null };
    }
  }

  // Single price (pode ser range) + nota opcional
  const range = extractPriceRange(stripped);
  if (range == null) {
    // Sob orçamento ou texto especial
    return { precoBase: null, variantes: null, precoTexto: stripped, nota: null };
  }
  const nota = partes.length > 1 ? partes.slice(1).join(" · ") : null;
  return { precoBase: range.min, precoMax: range.max, variantes: null, precoTexto: null, nota };
}

interface RawItem {
  title: string;
  description?: string;
  price?: string;
}

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (process.env.ALLOW_MIGRATIONS !== "1") {
    return NextResponse.json({ error: "Migrations disabled" }, { status: 403 });
  }

  try {
  const contentDir = path.join(process.cwd(), "content", "pt", "servicos");
  let total = 0;
  const detalhes: Record<string, number> = {};

  for (const slug of SERVICO_SLUG) {
    try {
      const raw = await readFile(path.join(contentDir, `${slug}.json`), "utf8");
      const json = JSON.parse(raw) as { items?: { list?: RawItem[] } };
      const list = json.items?.list ?? [];
      let ordem = 0;
      for (const item of list) {
        const priceRaw = item.price ?? "";
        const { precoBase, precoMax = null, variantes, precoTexto, nota } = parsePrice(priceRaw);
        const now = new Date().toISOString();
        const servico: Servico = {
          id: `seed_${slug}_${ordem}`,
          slug: slug as ServicoSlug,
          titulo: stripHtml(item.title ?? "(sem título)"),
          descricao: item.description ? stripHtml(item.description) : null,
          precoBase,
          precoMax,
          precoDesde: false,
          variantes,
          precoTexto,
          nota,
          ordem,
          ativo: true,
          criadoEm: now,
          atualizadoEm: now,
        };
        await upsertServico(servico);
        ordem += 1;
        total += 1;
      }
      detalhes[slug] = ordem;
    } catch (e) {
      detalhes[slug] = -1;
      console.error(`Seed ${slug} falhou`, e);
    }
  }

  void randomUUID;

  return NextResponse.json({ ok: true, total, detalhes });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
