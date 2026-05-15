export const TAREFA_STATUS = [
  "proximo",
  "em-curso",
  "aguarda-cliente",
  "aguarda-pecas",
  "aguarda-fornecedor",
  "pronto",
  "fechado",
  "cancelado",
  "garantia",
  "suspenso",
  "bloqueado",
  "em-divida",
] as const;

export type TarefaStatus = (typeof TAREFA_STATUS)[number];

export const STATUS_LABELS: Record<TarefaStatus, string> = {
  proximo: "Próximo",
  "em-curso": "Em curso",
  "aguarda-cliente": "Aguarda cliente",
  "aguarda-pecas": "Aguarda peças",
  "aguarda-fornecedor": "Aguarda fornecedor",
  pronto: "Pronto",
  fechado: "Fechado",
  cancelado: "Cancelado",
  garantia: "Garantia",
  suspenso: "Suspenso",
  bloqueado: "Bloqueado",
  "em-divida": "Em dívida",
};

export const STATUS_GROUPS = {
  ativo: ["em-curso"] as TarefaStatus[],
  proximo: ["proximo"] as TarefaStatus[],
  aguarda: [
    "aguarda-cliente",
    "aguarda-pecas",
    "aguarda-fornecedor",
    "suspenso",
    "bloqueado",
  ] as TarefaStatus[],
  pronto: ["pronto"] as TarefaStatus[],
  arquivo: ["fechado", "cancelado", "garantia", "em-divida"] as TarefaStatus[],
};

export const TAREFA_TIPO = [
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

export type TarefaTipo = (typeof TAREFA_TIPO)[number];

export const TAREFA_RESPONSAVEL = ["eu", "cliente", "fornecedor"] as const;
export type TarefaResponsavel = (typeof TAREFA_RESPONSAVEL)[number];

export const TAREFA_PASTA = ["clientes", "internos"] as const;
export type TarefaPasta = (typeof TAREFA_PASTA)[number];

export interface Tarefa {
  id: string;
  titulo: string;
  cliente: string | null;
  proximaAccao: string | null;
  status: TarefaStatus;
  tipo: TarefaTipo | null;
  responsavel: TarefaResponsavel | null;
  prazo: string | null;
  dataCriado: string | null;
  valorEstimado: number | null;
  notasResumo: string | null;
  pasta: TarefaPasta;
  sourcePath: string;
}

export type TarefaPublic = Omit<Tarefa, "sourcePath">;

export type SyncMeta = {
  updatedAt: string;
  count: number;
};
