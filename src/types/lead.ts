import type { ContactSubject } from "@/lib/validation";

/** Pipeline de leads captados pelo formulário de contacto do site público. */
export const LEAD_ESTADOS = [
  "novo",
  "contactado",
  "orcamento",
  "ganho",
  "perdido",
] as const;
export type LeadEstado = (typeof LEAD_ESTADOS)[number];

export const LEAD_ESTADO_LABELS: Record<LeadEstado, string> = {
  novo: "Novo",
  contactado: "Contactado",
  orcamento: "Orçamento",
  ganho: "Ganho",
  perdido: "Perdido",
};

export interface Lead {
  id: string;
  nome: string;
  email: string;
  subject: ContactSubject;
  mensagem: string;
  origem: "contact-form";
  estado: LeadEstado;
  ip?: string | null;
  notas?: string | null;
  /** Preenchido quando o lead é convertido em cliente. */
  clienteId?: string | null;
  criadoEm: string;
  atualizadoEm: string;
}
