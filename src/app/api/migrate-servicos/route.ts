import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/lib/auth";
import { upsertServico } from "@/lib/mongodb/servicos";
import { SERVICO_SLUG, type Servico, type ServicoSlug } from "@/types/servico";

export const dynamic = "force-dynamic";

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").trim();
}

/**
 * Tenta extrair preço base + nota dum string de preço.
 * Casos:
 *  - "<b>25€</b> · abatido se reparares" → { precoBase: 25, nota: "abatido se reparares" }
 *  - "Desktop <b>20–30€</b> · Portátil <b>25–35€</b>" → { precoTexto: <stripped>, precoBase: null }
 *  - "Sob orçamento" → { precoTexto: "Sob orçamento", precoBase: null }
 */
function parsePrice(raw: string): { precoBase: number | null; precoTexto: string | null; nota: string | null } {
  const stripped = stripHtml(raw);
  // Multi-valor (vários números ou variantes com etiquetas "Desktop"/"Portátil"/"–")
  const numeros = stripped.match(/\d+(?:[.,]\d+)?/g) ?? [];
  const ehMultiVariante = numeros.length > 1 || /Desktop|Portátil|Office|Gaming|High|\/comp\.|km/i.test(stripped);
  if (ehMultiVariante) {
    return { precoBase: null, precoTexto: stripped, nota: null };
  }
  if (numeros.length === 0) {
    return { precoBase: null, precoTexto: stripped, nota: null };
  }
  const primeiro = numeros[0] ?? "0";
  const precoBase = parseFloat(primeiro.replace(",", "."));
  // tudo após o primeiro "·" é nota
  const partes = stripped.split("·").map((s) => s.trim());
  const nota = partes.length > 1 ? partes.slice(1).join(" · ") : null;
  return { precoBase, precoTexto: null, nota };
}

interface RawItem {
  title: string;
  description?: string;
  price?: string;
}

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
        const { precoBase, precoTexto, nota } = parsePrice(priceRaw);
        const now = new Date().toISOString();
        const servico: Servico = {
          id: `seed_${slug}_${ordem}`,
          slug: slug as ServicoSlug,
          titulo: stripHtml(item.title ?? "(sem título)"),
          descricao: item.description ? stripHtml(item.description) : null,
          precoBase,
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

  // Suppress unused warning for randomUUID (mantido caso queiras gerar ids únicos no futuro)
  void randomUUID;

  return NextResponse.json({ ok: true, total, detalhes });
}
