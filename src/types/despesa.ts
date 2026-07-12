// Despesas da empresa (gastos que o Iuri compra/paga do bolso).
// Duas fontes alimentam os relatórios de gastos:
//   1. Linhas de custo do projecto com `gastoEmpresa: true` (ver ProjetoLinha).
//   2. Despesas manuais NÃO ligadas a projecto (stock da loja, domínios,
//      marketing, licenças…) — esta colecção.
// `projetoId` opcional permite também registar manualmente um gasto ligado a um
// projecto sem ser via linha, mas o caso principal é gasto geral (projetoId null).

export const DESPESA_CATEGORIA = [
  "stock",
  "pecas",
  "software",
  "dominios",
  "marketing",
  "outros",
] as const;

export type DespesaCategoria = (typeof DESPESA_CATEGORIA)[number];

export const DESPESA_CATEGORIA_LABEL: Record<DespesaCategoria, string> = {
  stock: "Stock da loja",
  pecas: "Peças & componentes",
  software: "Software & licenças",
  dominios: "Domínios & alojamento",
  marketing: "Marketing",
  outros: "Outros",
};

// Ordem de apresentação nos gráficos/listas de gastos por categoria.
export const DESPESA_CATEGORIA_ORDER: DespesaCategoria[] = [
  "stock",
  "pecas",
  "software",
  "dominios",
  "marketing",
  "outros",
];

export interface Despesa {
  id: string;
  descricao: string;
  categoria: DespesaCategoria;
  valor: number;
  data: string; // ISO date (yyyy-mm-dd) — quando o gasto foi feito
  projetoId: string | null; // opcional: gasto ligado a um projecto
  notas: string | null;
  criadoEm: string; // ISO — quando foi registado no painel
}
