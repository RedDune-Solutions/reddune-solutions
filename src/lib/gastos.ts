// Agregação de gastos da empresa a partir das duas fontes:
//   1. Linhas de custo de projectos marcadas `gastoEmpresa` (atribuídas ao mês do
//      projecto — proxy: dataCriado, quando as compras normalmente acontecem).
//   2. Despesas manuais (colecção `despesas`) — têm data própria.
// Funções puras sobre dados já carregados (sem DB) — usadas pelo dashboard e
// pelos relatórios para os números baterem certo entre ecrãs.
import { computeGastoEmpresa, type Projeto } from "@/types/projeto";
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
  /** Chave estável: id da despesa (manual) ou `<projetoId>:<linhaId>` (linha). */
  id: string;
  data: string; // ISO
  descricao: string;
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
        id: `${p.id}:${l.id}`,
        data,
        descricao: l.descricao,
        valor: l.quantidade * l.precoUnit,
        categoria: linhaCatToDespesaCat(l.categoria),
        projetoId: p.id,
        fonte: "linha",
      });
    }
  }
  for (const d of despesas) {
    events.push({
      id: d.id,
      data: d.data,
      descricao: d.descricao,
      valor: d.valor,
      categoria: d.categoria,
      projetoId: d.projetoId,
      fonte: "manual",
    });
  }
  return events;
}

/**
 * Gasto da empresa imputado a UM projecto, para toda a vida do projecto — as
 * mesmas duas fontes que `collectGastos` conta nos relatórios (linhas ✓ +
 * despesas ligadas). Usado pelo "Lucro" da ficha do projecto, para os dois
 * ecrãs não darem respostas diferentes a "quanto gastei neste projecto".
 *
 * Nota: `collectGastos` ignora linhas sem data possível (linha sem `data` E
 * projecto sem `dataCriado`/`dataFechado`), porque não as consegue pôr num mês.
 * Aqui contam à mesma — o dinheiro saiu. Nesse caso raro a ficha fica acima do
 * total mensal dos relatórios, e é a ficha que está certa.
 */
export function gastoEmpresaDoProjeto(
  projeto: Projeto,
  despesasDoProjeto: Despesa[]
): number {
  return (
    computeGastoEmpresa(projeto.linhas) +
    despesasDoProjeto.reduce((s, d) => s + d.valor, 0)
  );
}

/** Ordena por data desc (mais recente primeiro); empate → manuais depois das linhas. */
export function sortGastosDesc(events: GastoEvent[]): GastoEvent[] {
  return [...events].sort((a, b) => b.data.localeCompare(a.data) || a.fonte.localeCompare(b.fonte));
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
