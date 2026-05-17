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

export interface VariantePreco {
  label: string;  // "Desktop", "Portátil", "Consola"
  preco: number;
}

export interface Servico {
  id: string;
  slug: ServicoSlug;
  titulo: string;
  descricao: string | null;
  precoBase: number | null;          // valor único; ignorado se `variantes` preenchido
  variantes: VariantePreco[] | null; // multi-preço; tem prioridade sobre precoBase
  precoTexto: string | null;         // LEGACY — só lido como último fallback p/ retrocompat
  nota: string | null;               // sufixo (ex "abatido se reparares")
  ordem: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

/**
 * Devolve a representação display do preço com markup `<b>` para o renderRich
 * da página pública. Ordem de precedência: variantes → precoBase → precoTexto (legacy) → "Sob consulta".
 */
export function formatPreco(
  s: Pick<Servico, "precoBase" | "variantes" | "precoTexto" | "nota">
): string {
  const nota = s.nota?.trim() ? ` · ${s.nota.trim()}` : "";

  if (s.variantes && s.variantes.length > 0) {
    return s.variantes
      .map((v) => `<b>${v.label} ${v.preco}€</b>`)
      .join(" · ") + nota;
  }

  if (s.precoBase != null) {
    return `<b>${s.precoBase}€</b>${nota}`;
  }

  if (s.precoTexto && s.precoTexto.trim()) {
    return s.precoTexto;
  }

  return "Sob consulta";
}
