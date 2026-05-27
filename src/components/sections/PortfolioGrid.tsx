"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";
import type { PortfolioItem, PortfolioCategoria } from "@/types/portfolio";
import { SERVICO_SLUG } from "@/types/servico";
import {
  PortfolioCardShared,
  CATEGORIA_FALLBACK_BG,
  DEFAULT_FALLBACK_BG,
} from "./PortfolioCardShared";

type Props = {
  items: PortfolioItem[];
  initialFilter?: string;
};

type FilterKey = "all" | PortfolioCategoria;

const FILTER_KEYS: ReadonlyArray<FilterKey> = ["all", ...SERVICO_SLUG];

// Spans editoriais — cycle p/ grid hand-laid
const SPAN_SCHEDULE = [7, 5, 5, 7, 4, 4, 4] as const;

function spanClass(span: number): string {
  if (span === 7) return "md:col-span-7";
  if (span === 5) return "md:col-span-5";
  return "md:col-span-4";
}

function bgFor(item: PortfolioItem): string {
  return item.categoria
    ? CATEGORIA_FALLBACK_BG[item.categoria] ?? DEFAULT_FALLBACK_BG
    : DEFAULT_FALLBACK_BG;
}

export function PortfolioGrid({ items, initialFilter }: Props) {
  const t = useTranslations("PortfolioPage");
  const rawLocale = useLocale();
  const locale = rawLocale === "en" ? "en" : "pt";

  const filterLabel = (key: FilterKey): string =>
    key === "all" ? t("filterAll") : t(`categoria.${key}`);

  const tagFor = (item: PortfolioItem): string =>
    item.categoria ? t(`categoria.${item.categoria}`) : t("uncategorized");
  const validInitial: FilterKey =
    initialFilter && (FILTER_KEYS as readonly string[]).includes(initialFilter)
      ? (initialFilter as FilterKey)
      : "all";
  const [filter, setFilter] = useState<FilterKey>(validInitial);

  const decorated = useMemo(
    () =>
      items.map((item, index) => {
        const spanCols = SPAN_SCHEDULE[index % SPAN_SCHEDULE.length]!;
        return {
          item,
          spanCols,
          minH: spanCols >= 7 ? 520 : 420,
        };
      }),
    [items]
  );

  const filtered = useMemo(
    () =>
      filter === "all"
        ? decorated
        : decorated.filter((d) => d.item.categoria === filter),
    [decorated, filter]
  );

  if (items.length === 0) {
    return (
      <p className="mx-auto max-w-content py-20 text-center text-ink-mute">
        {t("emptyState")}
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-content px-8">
      {/* Filter bar */}
      <Reveal>
        <div
          role="tablist"
          aria-label={t("filterAriaLabel")}
          className={cn(
            "flex flex-wrap items-center gap-2 mb-12 md:mb-16",
            "rounded-btn bg-sand-warm/60 backdrop-blur",
            "p-2 border border-dune-deep/10 w-fit"
          )}
        >
          {FILTER_KEYS.map((key) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(key)}
                className={cn(
                  "rounded-btn px-4 py-2",
                  "font-mono text-[11px] uppercase tracking-[0.18em]",
                  "transition-all duration-300",
                  active
                    ? "bg-ink text-cream shadow-warm"
                    : "text-ink-soft hover:text-ink hover:bg-cream/60"
                )}
              >
                {filterLabel(key)}
              </button>
            );
          })}
        </div>
      </Reveal>

      {/* Grid */}
      <div className={cn("grid gap-5", "grid-cols-1 md:grid-cols-12")}>
        {filtered.map((d) => (
          <PortfolioCardShared
            key={d.item.id}
            item={d.item}
            locale={locale}
            tag={tagFor(d.item)}
            fallbackBg={bgFor(d.item)}
            className={cn("col-span-12", spanClass(d.spanCols))}
            style={{ minHeight: `${d.minH}px` }}
            imageSizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 40vw"
          />
        ))}
      </div>

      {filtered.length === 0 && filter !== "all" && (
        <p className="py-12 text-center text-ink-mute">{t("emptyState")}</p>
      )}
    </div>
  );
}
