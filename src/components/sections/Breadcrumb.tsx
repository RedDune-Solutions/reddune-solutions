import Link from "next/link";
import { getLocale } from "next-intl/server";
import { publicEnv } from "@/lib/env";
import { breadcrumbLd, jsonLdScript } from "@/lib/structured-data";
import { cn } from "@/lib/utils";

export type Crumb = {
  label: string;
  /** Nome no JSON-LD, se diferente do visível. Ex.: pill mostra "Assistência
   *  Técnica" (curto, cabe em mobile) mas o SEO usa "Assistência Técnica
   *  Informática". Ausente = usa `label`. */
  ldName?: string;
  /** Caminho relativo (ex: "/servicos"). No último item serve o JSON-LD
   *  (posição canónica); o visual nunca faz link no item actual. */
  href?: string;
};

/**
 * Breadcrumb — vive DENTRO da pill do hero (`.hero-kicker` no `PageHero`), a
 * substituir o antigo eyebrow. Rende o `<nav>` visível E o `BreadcrumbList`
 * JSON-LD da mesma lista, para nunca divergirem. O último item é a página
 * actual (`aria-current`, sem link).
 *
 * Server component: busca o locale para o aria-label, por isso o `PageHero` só
 * passa `items`.
 */
export async function Breadcrumb({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;

  const locale = await getLocale();
  const ariaLabel = locale === "en" ? "Breadcrumb" : "Navegação estrutural";

  const ld = breadcrumbLd(
    items.map((c) => ({
      name: c.ldName ?? c.label,
      url: c.href ? `${publicEnv.baseUrl}${c.href}` : publicEnv.baseUrl,
    })),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(ld) }}
      />
      <nav aria-label={ariaLabel} className="flex items-center">
        <ol className="flex flex-wrap items-center gap-[6px]">
          {items.map((crumb, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={crumb.label} className="flex items-center gap-[6px]">
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="text-ink-soft/80 transition-colors hover:text-ember"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={cn(isLast ? "text-ink-soft" : "text-ink-soft/80")}
                  >
                    {crumb.label}
                  </span>
                )}
                {!isLast && (
                  <span aria-hidden="true" className="text-dune-deep/40">
                    ·
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
