export const PROJETO_STATUS = [
  "ideia-interna",
  "ideia-cliente",
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
  "ideia-interna": "Ideia (interna)",
  "ideia-cliente": "Ideia (cliente)",
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
  ideias: ["ideia-interna", "ideia-cliente"] as ProjetoStatus[],
  ideiasInternas: ["ideia-interna"] as ProjetoStatus[],
  ideiasCliente: ["ideia-cliente"] as ProjetoStatus[],
};

import type { ServicoSlug } from "@/types/servico";

export const PROJETO_TIPO = [
  // assistencia-tecnica
  "diagnostico",
  "montagem",
  "reparacao",
  "troca-pecas",
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
  "troca-pecas": "Troca de peças",
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
  "troca-pecas": "assistencia-tecnica",
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
  "assistencia-tecnica": ["diagnostico", "montagem", "reparacao", "troca-pecas", "acessorios"],
  "web-digital": ["web", "app", "automacao", "marketing", "redes-sociais", "consultoria", "formacao"],
  "software-recuperacao": ["recuperacao-dados", "formatacao"],
};

export const PROJETO_RESPONSAVEL = ["eu", "cliente", "fornecedor"] as const;
export type ProjetoResponsavel = (typeof PROJETO_RESPONSAVEL)[number];

export const RESPONSAVEL_LABEL: Record<ProjetoResponsavel, string> = {
  eu: "Meu lado",
  cliente: "Cliente",
  fornecedor: "Parceiro",
};

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

export interface ProjetoHardware {
  marca?: string;
  modelo?: string;
  serial?: string;
  acessoriosEntregues?: string;
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
  tipos: string[] | null; // base ProjetoTipo + custom slugs
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
  hardware: ProjetoHardware | null;
}

export function deriveCategoriasFromTipos(tipos: ProjetoTipo[] | null): ServicoSlug[] {
  if (!tipos || tipos.length === 0) return [];
  return [
    ...new Set(
      tipos.map((t) => TIPO_TO_CATEGORIA[t]).filter((c): c is ServicoSlug => c != null)
    ),
  ];
}
