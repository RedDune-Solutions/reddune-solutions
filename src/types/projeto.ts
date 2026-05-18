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

import type { ServicoSlug } from "@/types/servico";

export const PROJETO_TIPO = [
  // assistencia-tecnica
  "diagnostico",
  "montagem",
  "reparacao",
  "acessorios",
  // web-digital
  "web",
  "app",
  "automacao",
  "marketing",
  "redes-sociais",
  "consultoria",
  "formacao",
  // software-recuperacao
  "recuperacao-dados",
  "formatacao",
  // sem categoria
  "intermediacao",
  "outro",
] as const;

export type ProjetoTipo = (typeof PROJETO_TIPO)[number];

export const PROJETO_TIPO_LABEL: Record<ProjetoTipo, string> = {
  diagnostico: "Diagnóstico",
  montagem: "Montagem",
  reparacao: "Reparação",
  acessorios: "Acessórios",
  web: "Web",
  app: "App",
  automacao: "Automação",
  marketing: "Marketing",
  "redes-sociais": "Redes sociais",
  consultoria: "Consultoria",
  formacao: "Formação",
  "recuperacao-dados": "Recuperação de dados",
  formatacao: "Formatação",
  intermediacao: "Intermediação",
  outro: "Outro",
};

export const TIPO_TO_CATEGORIA: Record<ProjetoTipo, ServicoSlug | null> = {
  diagnostico: "assistencia-tecnica",
  montagem: "assistencia-tecnica",
  reparacao: "assistencia-tecnica",
  acessorios: "assistencia-tecnica",
  web: "web-digital",
  app: "web-digital",
  automacao: "web-digital",
  marketing: "web-digital",
  "redes-sociais": "web-digital",
  consultoria: "web-digital",
  formacao: "web-digital",
  "recuperacao-dados": "software-recuperacao",
  formatacao: "software-recuperacao",
  intermediacao: null,
  outro: null,
};

export const CATEGORIA_TIPOS: Record<ServicoSlug, ProjetoTipo[]> = {
  "assistencia-tecnica": ["diagnostico", "montagem", "reparacao", "acessorios"],
  "web-digital": ["web", "app", "automacao", "marketing", "redes-sociais", "consultoria", "formacao"],
  "software-recuperacao": ["recuperacao-dados", "formatacao"],
};

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
  categoria: ServicoSlug | null;
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
