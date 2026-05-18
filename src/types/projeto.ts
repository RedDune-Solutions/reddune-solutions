export const PROJETO_STATUS = [
  "ideia",
  "proximo",
  "em-curso",
  "aguardando-cliente",
  "aguardando-encomenda",
  "terminado",
  "fechado",
  "cancelado",
] as const;

export type ProjetoStatus = (typeof PROJETO_STATUS)[number];

export const STATUS_LABELS: Record<ProjetoStatus, string> = {
  ideia: "Ideia",
  proximo: "Próximo",
  "em-curso": "Em curso",
  "aguardando-cliente": "Aguarda cliente",
  "aguardando-encomenda": "Aguarda encomenda",
  terminado: "Terminado",
  fechado: "Fechado",
  cancelado: "Cancelado",
};

export const STATUS_GROUPS = {
  ativo: ["em-curso"] as ProjetoStatus[],
  proximo: ["proximo"] as ProjetoStatus[],
  aguarda: ["aguardando-cliente", "aguardando-encomenda"] as ProjetoStatus[],
  aguardaCliente: ["aguardando-cliente"] as ProjetoStatus[],
  aguardaEncomenda: ["aguardando-encomenda"] as ProjetoStatus[],
  pronto: ["terminado"] as ProjetoStatus[],
  arquivo: ["fechado", "cancelado"] as ProjetoStatus[],
  comprometido: ["em-curso", "aguardando-encomenda", "terminado"] as ProjetoStatus[],
  ideias: ["ideia"] as ProjetoStatus[],
};

export const PROJETO_TIPO = [
  "diagnostico",
  "montagem",
  "formatacao",
  "reparacao",
  "acessorios",
  "web",
  "app",
  "automacao",
  "marketing",
  "consultoria",
  "formacao",
  "redes-sociais",
  "intermediacao",
  "outro",
] as const;

export type ProjetoTipo = (typeof PROJETO_TIPO)[number];

export const PROJETO_RESPONSAVEL = ["eu", "cliente", "fornecedor"] as const;
export type ProjetoResponsavel = (typeof PROJETO_RESPONSAVEL)[number];

export const PROJETO_LOCAL = ["oficina", "casa-cliente", "remoto"] as const;
export type ProjetoLocal = (typeof PROJETO_LOCAL)[number];

export const LINHA_CATEGORIA = ["peca", "mao-obra", "outro"] as const;
export type LinhaCategoria = (typeof LINHA_CATEGORIA)[number];

export const LINHA_CATEGORIA_LABEL: Record<LinhaCategoria, string> = {
  peca: "Peça",
  "mao-obra": "Mão-de-obra",
  outro: "Outro",
};

export interface ProjetoLinha {
  id: string;
  descricao: string;
  categoria: LinhaCategoria;
  quantidade: number;
  precoUnit: number;
}

export interface Projeto {
  id: string;
  titulo: string;
  clienteId: string | null;
  clienteNome: string | null;
  proximaAccao: string | null;
  status: ProjetoStatus;
  tipo: ProjetoTipo | null;
  responsavel: ProjetoResponsavel | null;
  prazo: string | null;
  dataCriado: string | null;
  dataFechado: string | null;
  valorEstimado: number | null;
  valorPago: number | null;
  metodoPagamento: string | null;
  local: ProjetoLocal | null;
  notasResumo: string | null;
  bodyMd: string | null;
  linhas: ProjetoLinha[] | null;
  garantiaAte: string | null;
}
