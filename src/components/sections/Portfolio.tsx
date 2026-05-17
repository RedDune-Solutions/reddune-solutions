"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";
import type { PortfolioItem } from "@/types/portfolio";
import { PORTFOLIO_CATEGORIA_LABEL } from "@/types/portfolio";
import {
  PortfolioCardShared,
  CATEGORIA_FALLBACK_BG,
  DEFAULT_FALLBACK_BG,
} from "./PortfolioCardShared";

type Props = { items: PortfolioItem[] };

/**
 * Portfolio — landing preview. Mostra até 3 cards (1 por categoria) marcados
 * como destaque na dashboard. Card visual partilhado com /portfolio.
 */

function tagFor(item: PortfolioItem): string {
  return item.categoria ? PORTFOLIO_CATEGORIA_LABEL[item.categoria] : "Projecto";
}

function bgFor(item: PortfolioItem): string {
  return item.categoria
    ? CATEGORIA_FALLBACK_BG[item.categoria] ?? DEFAULT_FALLBACK_BG
    : DEFAULT_FALLBACK_BG;
}

export function Portfolio({ items }: Props) {
  const t = useTranslations("HomePage.PortfolioSection");
  const rawLocale = useLocale();
  const locale = rawLocale === "en" ? "en" : "pt";

  return (
    <section
      id="portfolio-preview"
      className="relative mx-auto block w-full max-w-content px-8 py-[120px]"
    >
      <Reveal>
        <span
          className={cn(
            "inline-flex items-center gap-[10px]",
            "rounded-btn border border-ember/20 bg-ember/[0.08]",
            "px-[14px] py-[6px] mb-7",
            "font-mono text-[11px] uppercase tracking-[0.2em] text-ember"
          )}
        >
          <span
            aria-hidden="true"
            className="block h-1.5 w-1.5 rounded-sm bg-ember"
          />
          {t.has("eyebrow") ? t("eyebrow") : "O nosso portfólio"}
        </span>
      </Reveal>
      <Reveal>
        <h2
          className={cn(
            "section-title font-display font-bold text-ink",
            "max-w-[1000px] mb-6",
            "text-[clamp(42px,5.5vw,88px)] leading-none tracking-[-0.035em]",
            "[&_em]:font-serif [&_em]:italic [&_em]:font-medium [&_em]:text-ember"
          )}
          style={{ fontVariationSettings: '"opsz" 88' }}
        >
          {t.rich("title", {
            accent: (chunks) => <em>{chunks}</em>,
          })}
        </h2>
      </Reveal>
      <Reveal>
        <p
          className={cn(
            "max-w-[640px] mb-[60px]",
            "text-[19px] leading-[1.55] text-ink-soft"
          )}
        >
          {t("description")}
        </p>
      </Reveal>

      {items.length === 0 ? (
        <p className="text-center text-ink-mute">{t("emptyState")}</p>
      ) : (
        <div
          className={cn(
            "portfolio-grid grid gap-5",
            "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          )}
        >
          {items.slice(0, 3).map((item) => (
            <Reveal key={item.id}>
              <PortfolioCardShared
                item={item}
                locale={locale}
                tag={tagFor(item)}
                displayTitle={tagFor(item)}
                fallbackBg={bgFor(item)}
                className="aspect-[4/5]"
                imageSizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </Reveal>
          ))}
        </div>
      )}

      <Reveal>
        <div className="mt-12 text-center">
          <Link
            href="/portfolio"
            className={cn(
              "inline-flex items-center gap-2",
              "font-mono text-[13px] uppercase tracking-[0.18em] text-ember",
              "transition-colors duration-300 hover:text-dune"
            )}
          >
            {t.has("seeAllPortfolioCta")
              ? t("seeAllPortfolioCta")
              : "Ver portfólio completo"}
            <ArrowRight
              className="size-[14px] shrink-0"
              strokeWidth={2.25}
              aria-hidden
            />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
