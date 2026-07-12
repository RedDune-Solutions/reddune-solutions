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

// Estados de projeto cujos cartões de tarefas são visíveis em /painel/tarefas.
// Tem de cobrir TODOS os estados em que o NovaTarefaGlobalButton permite criar
// tarefas — caso contrário trabalho criado fica invisível. Ver STATUS_GROUPS
// abaixo: ativo + proximo + aguarda + pronto.
export const TAREFAS_VISIVEIS_STATUSES: ProjetoStatus[] = [
  "em-curso",
  "proximo",
  "aguardando-cliente",
  "aguardando-encomenda",
  "terminado",
];

// Fonte ÚNICA de "projecto activo" — usada pelo badge da sidebar/bottomnav E
// pelo título de /painel/projetos, para os números baterem certo (antes o badge
// contava em-curso/proximo e o título contava tudo menos fechado/cancelado).
export const PROJETO_ATIVO_STATUSES: ProjetoStatus[] = ["em-curso", "proximo"];
export function isProjetoAtivo(status: ProjetoStatus): boolean {
  return PROJETO_ATIVO_STATUSES.includes(status);
}

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
  // true = esta linha foi um gasto real da empresa (peça/serviço que o Iuri
  // comprou/pagou do bolso), não só o preço que o cliente paga. Alimenta os
  // relatórios de gastos. Default false (undefined trata-se como false).
  gastoEmpresa?: boolean;
}

/** Total de gasto da empresa nas linhas de um projecto (só linhas marcadas). */
export function computeGastoEmpresa(linhas: ProjetoLinha[] | null | undefined): number {
  if (!linhas) return 0;
  return linhas.reduce(
    (sum, l) => (l.gastoEmpresa ? sum + l.quantidade * l.precoUnit : sum),
    0
  );
}

export interface ProjetoHardware {
  marca?: string;
  modelo?: string;
  serial?: string;
  acessoriosEntregues?: string;
}

export interface ProjetoArquivo {
  id: string; // uuid
  pathname: string; // path no blob store: projetos/<projetoId>/<uuid>.<ext>
  blobUrl?: string; // URL cru do Vercel Blob — APENAS server-side, nunca enviado ao cliente
  url: string; // URL do proxy autenticado servido ao cliente
  nome: string; // nome original do ficheiro
  tamanho: number; // bytes
  tipo: string; // MIME
  dataUpload: string; // ISO
}

/** Remove campos server-only antes de enviar arquivos ao cliente. */
export function sanitizeArquivo(a: ProjetoArquivo): ProjetoArquivo {
  const { blobUrl: _blobUrl, ...rest } = a;
  void _blobUrl;
  return rest;
}

export interface ProjetoLink {
  id: string;
  label: string;
  url: string; // https:// (validado na API)
}

export interface ProjetoPortal {
  tokenHash: string; // SHA-256 hex do token; o token em claro nunca é guardado
  criadoEm: string; // ISO
  revogadoEm: string | null;
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
  arquivos: ProjetoArquivo[] | null;
  links: ProjetoLink[] | null;
  portal: ProjetoPortal | null;
}

export function deriveCategoriasFromTipos(tipos: ProjetoTipo[] | null): ServicoSlug[] {
  if (!tipos || tipos.length === 0) return [];
  return [
    ...new Set(
      tipos.map((t) => TIPO_TO_CATEGORIA[t]).filter((c): c is ServicoSlug => c != null)
    ),
  ];
}
