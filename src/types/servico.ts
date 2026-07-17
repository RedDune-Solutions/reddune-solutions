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

// Texto bilingue opcional. PT é canónico; EN preenchido pelo admin.
export type I18nText = { pt?: string | null; en?: string | null };

export type Locale = "pt" | "en";

/**
 * Resolve texto i18n com fallback. Ordem:
 *   1. `i18n[locale]` se preenchido
 *   2. `i18n.pt` (PT como fallback canónico)
 *   3. `legacy` (campo string antigo p/ retrocompat com docs Mongo pré-migração)
 *   4. "" (string vazia)
 */
export function pickLocalized(
  i18n: I18nText | null | undefined,
  legacy: string | null | undefined,
  locale: Locale,
): string {
  const v = i18n?.[locale]?.trim();
  if (v) return v;
  const pt = i18n?.pt?.trim();
  if (pt) return pt;
  return (legacy ?? "").trim();
}

export interface VariantePreco {
  label: string;       // legacy / canónico PT
  labelI18n?: I18nText | null; // override por locale
  preco: number;       // preço mínimo (ou único)
  precoMax?: number | null; // preço máximo — se definido, mostra "X€ a Y€"
}

export interface Servico {
  id: string;
  slug: ServicoSlug;
  titulo: string;                      // legacy / canónico PT
  tituloI18n?: I18nText | null;        // override bilingue
  descricao: string | null;            // legacy / canónico PT
  descricaoI18n?: I18nText | null;
  precoBase: number | null;
  precoMax: number | null;
  precoDesde: boolean;
  variantes: VariantePreco[] | null;
  precoTexto: string | null;           // LEGACY string
  precoTextoI18n?: I18nText | null;
  nota: string | null;                 // legacy / canónico PT
  notaI18n?: I18nText | null;
  imageUrl: string | null;
  ordem: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

// Helpers de leitura locale-aware
export function servicoTitulo(s: Pick<Servico, "titulo" | "tituloI18n">, locale: Locale): string {
  return pickLocalized(s.tituloI18n, s.titulo, locale);
}
export function servicoDescricao(s: Pick<Servico, "descricao" | "descricaoI18n">, locale: Locale): string {
  return pickLocalized(s.descricaoI18n, s.descricao, locale);
}
export function servicoNota(s: Pick<Servico, "nota" | "notaI18n">, locale: Locale): string {
  return pickLocalized(s.notaI18n, s.nota, locale);
}
export function variantePrecoLabel(v: VariantePreco, locale: Locale): string {
  return pickLocalized(v.labelI18n, v.label, locale);
}

export type PriceLabels = {
  from: string;       // "desde" / "from"
  to: string;         // "a" / "to"
  onRequest: string;  // "Sob consulta" / "On request"
};

const DEFAULT_PRICE_LABELS_PT: PriceLabels = {
  from: "desde",
  to: "a",
  onRequest: "Sob consulta",
};

/**
 * Preço com `<b>` À VOLTA DO NÚMERO — e só do número.
 *
 * CONTRATO (design-handoff `.svc .meta-row .price b`): `<b>` = valor monetário
 * (ember, font-display, 15px). Rótulos ("Torre", "desde") ficam fora: mono 12px,
 * ink-soft. É a mesma regra que `content/{locale}/servicos/*.json` escreve à mão
 * ("Desktop <b>20–30€</b>") — sem isto, as duas fontes desenham o preço de
 * maneira diferente e a linha toda fica laranja.
 *
 * O conector ("a") fica DENTRO do `<b>`: o intervalo é um só token, e um "a"
 * cinzento entre dois números display abana a linha de base.
 */
function fmtRangeRich(min: number, max: number | null | undefined, desde: boolean | undefined, labels: PriceLabels): string {
  if (max != null && max > min) return `<b>${min}€ ${labels.to} ${max}€</b>`;
  if (desde) return `${labels.from} <b>${min}€</b>`;
  return `<b>${min}€</b>`;
}

/**
 * Devolve a representação display do preço com markup `<b>` para o renderRich
 * da página pública. Ordem de precedência: variantes → precoBase → precoTexto (legacy) → onRequest.
 *
 * `labels` opcional — sem ele, usa texto PT (retrocompat). Passar labels p/ i18n.
 */
export function formatPreco(
  s: Pick<Servico, "precoBase" | "precoMax" | "precoDesde" | "variantes" | "precoTexto" | "precoTextoI18n" | "nota" | "notaI18n">,
  labels: PriceLabels = DEFAULT_PRICE_LABELS_PT,
  locale: Locale = "pt"
): string {
  const notaRaw = pickLocalized(s.notaI18n, s.nota, locale);
  const nota = notaRaw.trim() ? ` · ${notaRaw.trim()}` : "";

  if (s.variantes && s.variantes.length > 0) {
    return s.variantes
      .map((v) => {
        const label = variantePrecoLabel(v, locale).trim();
        const valor = fmtRangeRich(v.preco, v.precoMax, s.precoDesde, labels);
        return label ? `${label} ${valor}` : valor;
      })
      .join(" · ") + nota;
  }

  if (s.precoBase != null) {
    return `${fmtRangeRich(s.precoBase, s.precoMax, s.precoDesde, labels)}${nota}`;
  }

  // Legacy: texto livre do admin. Passa cru — não dá para adivinhar onde está o
  // valor, por isso fica todo em ink-soft. Linhas ainda neste ramo não traduzem
  // se `precoTextoI18n.en` estiver vazio; ver painel.
  const precoTextoLocalized = pickLocalized(s.precoTextoI18n, s.precoTexto, locale);
  if (precoTextoLocalized.trim()) {
    return `${precoTextoLocalized.trim()}${nota}`;
  }

  // "Sob consulta" é o token de valor desta linha — logo vai em <b>, como o
  // "<b>sob orçamento</b>" que os JSON escrevem à mão.
  return `<b>${labels.onRequest}</b>${nota}`;
}
