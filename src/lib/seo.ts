/**
 * seo — helpers de metadata partilhados entre páginas.
 */

/**
 * Converte o locale do next-intl ("pt"/"en") no formato Open Graph
 * `ll_CC` (og:locale exige território, ex.: pt_PT).
 */
export function ogLocale(locale: string): string {
  return locale === "en" ? "en_GB" : "pt_PT";
}
