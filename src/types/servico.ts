export const SERVICO_SLUG = [
  "assistencia-tecnica",
  "web-digital",
  "software-recuperacao",
] as const;

export type ServicoSlug = (typeof SERVICO_SLUG)[number];

export const SERVICO_SLUG_LABEL: Record<ServicoSlug, string> = {
  "assistencia-tecnica": "Assistência Técnica",
  "web-digital": "Web & Digital",
  "software-recuperacao": "Software & Recuperação",
};

export interface Servico {
  id: string;
  slug: ServicoSlug;
  titulo: string;
  descricao: string | null;
  precoBase: number | null;     // valor numérico simples
  precoTexto: string | null;    // override display para multi-variante / "sob orçamento"
  nota: string | null;          // sufixo (ex "abatido se reparares")
  ordem: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export function formatPreco(s: Pick<Servico, "precoBase" | "precoTexto" | "nota">): string {
  if (s.precoTexto && s.precoTexto.trim()) return s.precoTexto;
  if (s.precoBase != null) {
    return s.nota ? `${s.precoBase}€ · ${s.nota}` : `${s.precoBase}€`;
  }
  return "Sob consulta";
}
