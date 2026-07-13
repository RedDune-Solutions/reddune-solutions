// Agregação de gastos da empresa a partir das duas fontes:
//   1. Linhas de custo de projectos marcadas `gastoEmpresa` (atribuídas ao mês do
//      projecto — proxy: dataCriado, quando as compras normalmente acontecem).
//   2. Despesas manuais (colecção `despesas`) — têm data própria.
// Funções puras sobre dados já carregados (sem DB) — usadas pelo dashboard e
// pelos relatórios para os números baterem certo entre ecrãs.
import type { Projeto } from "@/types/projeto";
import type { Despesa, DespesaCategoria } from "@/types/despesa";

/** Mapeia a categoria da linha de custo para o balde de despesa dos relatórios. */
export function linhaCatToDespesaCat(cat: "peca" | "mao-obra" | "outro"): DespesaCategoria {
  if (cat === "peca") return "pecas";
  return "outros"; // mão-de-obra e outro caem em "Outros"
}

/** Data que atribui um gasto de linha de projecto a um mês (proxy: início do projecto). */
export function projetoGastoDate(p: Projeto): string | null {
  return p.dataCriado ?? p.dataFechado ?? null;
}

export type GastoEvent = {
  data: string; // ISO
  valor: number;
  categoria: DespesaCategoria;
  projetoId: string | null;
  fonte: "linha" | "manual";
};

/** Achata todas as fontes de gasto num único array de eventos. */
export function collectGastos(projetos: Projeto[], despesas: Despesa[]): GastoEvent[] {
  const events: GastoEvent[] = [];
  for (const p of projetos) {
    const fallback = projetoGastoDate(p);
    if (!p.linhas) continue;
    for (const l of p.linhas) {
      if (!l.gastoEmpresa) continue;
      // Regime de caixa: data própria da linha (quando o Iuri pagou) tem
      // prioridade; sem data, cai no mês do projecto como antes.
      const data = l.data ?? fallback;
      if (!data) continue;
      events.push({
        data,
        valor: l.quantidade * l.precoUnit,
        categoria: linhaCatToDespesaCat(l.categoria),
        projetoId: p.id,
        fonte: "linha",
      });
    }
  }
  for (const d of despesas) {
    events.push({
      data: d.data,
      valor: d.valor,
      categoria: d.categoria,
      projetoId: d.projetoId,
      fonte: "manual",
    });
  }
  return events;
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** Soma dos gastos num mês (chave yyyy-mm). */
export function sumGastosInMonth(events: GastoEvent[], key: string): number {
  return events.reduce((s, e) => (monthKey(e.data) === key ? s + e.valor : s), 0);
}

/** Soma total dos gastos cujas datas caem num conjunto de chaves de mês. */
export function sumGastosInMonths(events: GastoEvent[], keys: Set<string>): number {
  return events.reduce((s, e) => (keys.has(monthKey(e.data)) ? s + e.valor : s), 0);
}

/** Total de gastos por categoria, opcionalmente filtrando por chaves de mês. */
export function gastosByCategoria(
  events: GastoEvent[],
  keys?: Set<string>
): Record<DespesaCategoria, number> {
  const acc = {
    stock: 0,
    pecas: 0,
    software: 0,
    dominios: 0,
    marketing: 0,
    outros: 0,
  } as Record<DespesaCategoria, number>;
  for (const e of events) {
    if (keys && !keys.has(monthKey(e.data))) continue;
    acc[e.categoria] += e.valor;
  }
  return acc;
}
