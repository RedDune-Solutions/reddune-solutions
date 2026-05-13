"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";
import type { PortfolioItem } from "@/types/portfolio";

type Props = {
  items: PortfolioItem[];
};

/**
 * PortfolioGrid — Phase 5 dedicated /portfolio grid with filter bar.
 *
 * Visual port of `.portfolio` from
 * `design-handoff/project/site/portfolio/index.html` (lines 49-79).
 *
 * Cards are arranged in a 12-col grid with varying spans (7/5, 5/7, 4/4/4) to
 * produce the editorial pattern. Filter bar above filters by an assigned tag
 * (cyclic mapping over Hardware / Web / Diagnóstico).
 */

type FilterKey = "all" | "hardware" | "web" | "diagnostico";
type TagKey = "hardware" | "web" | "diagnostico";

const TAG_BACKGROUNDS = [
  "radial-gradient(circle at 30% 30%, #ff8a5c, var(--ember) 40%, var(--dune-deep) 80%)",
  "linear-gradient(135deg, #ecdfc2, #b88a5c 50%, #5a3a26)",
  "radial-gradient(circle at 70% 30%, #f4a76a, #b3221c 50%, #2a0805 90%)",
] as const;

// Editorial column spans for desktop: cycle through these so the grid feels
// hand-laid. Matches the rhythm from the design HTML.
const SPAN_SCHEDULE = [7, 5, 5, 7, 4, 4, 4] as const;

const FILTER_KEYS: ReadonlyArray<FilterKey> = [
  "all",
  "hardware",
  "web",
  "diagnostico",
];

function spanClass(span: number): string {
  if (span === 7) return "md:col-span-7";
  if (span === 5) return "md:col-span-5";
  return "md:col-span-4";
}

function PortfolioCard({
  item,
  locale,
  tag,
  background,
  spanCols,
  minH,
}: {
  item: PortfolioItem;
  locale: "pt" | "en";
  tag: string;
  background: string;
  spanCols: number;
  minH: number;
}) {
  const image = item.imageUrl;

  return (
    <Link
      href={item.url || "https://www.instagram.com/reddune_solutions/"}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={item.title[locale]}
      className={cn(
        "group relative block overflow-hidden rounded-[28px]",
        "shadow-warm transition-all duration-700 ease-oasis",
        "hover:-translate-y-2.5 hover:scale-[1.015] hover:shadow-warm-lg",
        "no-underline text-ink",
        "col-span-12",
        spanClass(spanCols),
      )}
      style={{
        background: image ? "var(--cream-deep)" : background,
        minHeight: `${minH}px`,
      }}
    >
      {image ? (
        <Image
          src={image}
          alt={item.title[locale]}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 40vw"
          className={cn(
            "absolute inset-0 object-cover transition-transform duration-700 ease-oasis",
            "group-hover:scale-[1.08]",
          )}
        />
      ) : null}

      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          "bg-gradient-to-b from-transparent via-transparent to-ink/75",
        )}
      />

      <span
        className={cn(
          "absolute left-[18px] top-[18px] z-[3]",
          "rounded-btn border border-white/30 bg-white/60 backdrop-blur",
          "px-3 py-1.5",
          "font-mono text-[10px] uppercase tracking-[0.18em] text-ink",
          "transition-all duration-500 ease-oasis",
          "group-hover:bg-apricot group-hover:translate-x-0.5 group-hover:-translate-y-1",
        )}
      >
        {tag}
      </span>

      <div
        className={cn(
          "absolute inset-x-6 bottom-6 z-[4] text-cream",
          "transition-transform duration-500 ease-oasis",
          "group-hover:-translate-y-2",
        )}
      >
        <h4
          className={cn(
            "font-display text-[22px] md:text-[26px] font-semibold leading-[1.05] tracking-[-0.01em] mb-1.5",
          )}
        >
          {item.title[locale]}
        </h4>
        <p className="text-[13px] opacity-85 text-cream-deep">{tag}</p>
        <span
          aria-hidden
          className={cn(
            "mt-3 inline-flex items-center gap-1.5",
            "font-mono text-[11px] uppercase tracking-[0.15em] text-apricot",
            "opacity-0 translate-y-3 transition-all duration-500 ease-oasis",
            "group-hover:opacity-100 group-hover:translate-y-0",
          )}
        >
          Ver projeto
          <ArrowRight className="size-3 shrink-0" strokeWidth={2.25} />
        </span>
      </div>
    </Link>
  );
}

export function PortfolioGrid({ items }: Props) {
  const t = useTranslations("PortfolioPage");
  const rawLocale = useLocale();
  const locale = rawLocale === "en" ? "en" : "pt";
  const [filter, setFilter] = useState<FilterKey>("all");

  const tagsRaw = t.raw("fallbackTags");
  const tags = Array.isArray(tagsRaw)
    ? (tagsRaw as string[])
    : ["Hardware", "Web", "Diagnóstico"];

  // Map each item to a cyclic tag and span. We compute once per items list.
  const decorated = useMemo(
    () =>
      items.map((item, index) => {
        const tagKeys: TagKey[] = ["hardware", "web", "diagnostico"];
        const spanCols = SPAN_SCHEDULE[index % SPAN_SCHEDULE.length];
        return {
          item,
          tag: tags[index % tags.length],
          tagKey: tagKeys[index % tagKeys.length],
          background: TAG_BACKGROUNDS[index % TAG_BACKGROUNDS.length],
          spanCols,
          minH: spanCols >= 7 ? 520 : 420,
        };
      }),
    [items, tags],
  );

  const filtered = useMemo(
    () =>
      filter === "all"
        ? decorated
        : decorated.filter((d) => d.tagKey === filter),
    [decorated, filter],
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
          aria-label="Filtros de categoria"
          className={cn(
            "flex flex-wrap items-center gap-2 mb-12 md:mb-16",
            "rounded-btn bg-sand-warm/60 backdrop-blur",
            "p-2 border border-dune-deep/10 w-fit",
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
                    : "text-ink-soft hover:text-ink hover:bg-cream/60",
                )}
              >
                {t(`filters.${key}`)}
              </button>
            );
          })}
        </div>
      </Reveal>

      {/* Grid */}
      <div
        className={cn(
          "grid gap-5",
          "grid-cols-1 md:grid-cols-12",
        )}
      >
        {filtered.map((d) => (
          <PortfolioCard
            key={d.item.id}
            item={d.item}
            locale={locale}
            tag={d.tag}
            background={d.background}
            spanCols={d.spanCols}
            minH={d.minH}
          />
        ))}
      </div>

      {filtered.length === 0 && filter !== "all" && (
        <p className="py-12 text-center text-ink-mute">{t("emptyState")}</p>
      )}
    </div>
  );
}
