export const METODO_PAGAMENTO = [
  "dinheiro",
  "mb",
  "mbway",
  "transferencia",
  "outro",
] as const;

export type MetodoPagamento = (typeof METODO_PAGAMENTO)[number];

export const METODO_LABEL: Record<MetodoPagamento, string> = {
  dinheiro: "Dinheiro",
  mb: "Multibanco",
  mbway: "MB Way",
  transferencia: "Transferência",
  outro: "Outro",
};

export interface Pagamento {
  id: string;
  projetoId: string;
  clienteId: string | null;
  valor: number;
  data: string; // ISO date
  metodo: MetodoPagamento | null;
  notas: string | null;
  criadoEm: string;
}
