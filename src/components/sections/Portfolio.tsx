"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";
import type { PortfolioItem } from "@/types/portfolio";

type Props = { items: PortfolioItem[] };

/**
 * Portfolio — Phase 4 Oasis portfolio preview.
 *
 * Direct port of `#portfolio-preview` from
 * `design-handoff/project/site/index.html` (lines 112-133).
 *
 * Each card is a 4:5 ratio tile with a dune-tinted background, an uppercase
 * mono tag pill (top-left), and an info block (h4 + sub) anchored at the
 * bottom. On hover the card lifts and the dune motif shifts (parallax depth).
 */

// 3 fallback variants for cards without uploaded media yet — palette matches
// the `pf-build / pf-web / pf-hw` variants in the design.
const FALLBACK_BACKGROUNDS = [
  "radial-gradient(circle at 30% 30%, #ff8a5c, var(--ember) 40%, var(--dune-deep) 80%)",
  "linear-gradient(135deg, #ecdfc2, #b88a5c 50%, #5a3a26)",
  "radial-gradient(circle at 70% 30%, #f4a76a, #b3221c 50%, #2a0805 90%)",
] as const;

const FALLBACK_TAGS = ["Hardware", "Web · App", "Diagnóstico"] as const;

function PortfolioCard({
  item,
  locale,
  fallbackIndex,
}: {
  item: PortfolioItem;
  locale: "pt" | "en";
  fallbackIndex: number;
}) {
  const image = item.imageUrl;
  const tag = FALLBACK_TAGS[fallbackIndex % FALLBACK_TAGS.length];

  return (
    <Link
      href={item.url || "/contacto?from=home"}
      target={item.url ? "_blank" : undefined}
      rel={item.url ? "noopener noreferrer" : undefined}
      aria-label={item.title[locale]}
      className={cn(
        "group relative block aspect-[4/5] overflow-hidden rounded-[28px]",
        "shadow-warm transition-all duration-700 ease-oasis",
        "hover:-translate-y-2.5 hover:scale-[1.015] hover:shadow-warm-lg",
        "no-underline text-ink",
      )}
      style={{
        background: image
          ? "var(--cream-deep)"
          : FALLBACK_BACKGROUNDS[fallbackIndex % FALLBACK_BACKGROUNDS.length],
      }}
    >
      {/* Image or fallback dune gradient */}
      {image ? (
        <Image
          src={image}
          alt={item.title[locale]}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={cn(
            "absolute inset-0 object-cover transition-transform duration-700 ease-oasis",
            "group-hover:scale-[1.08]",
          )}
        />
      ) : null}

      {/* Bottom darkening gradient */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          "bg-gradient-to-b from-transparent via-transparent to-ink/75",
        )}
      />

      {/* Tag pill (top-left) */}
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

      {/* Info block (bottom) */}
      <div
        className={cn(
          "absolute inset-x-6 bottom-6 z-[4] text-cream",
          "transition-transform duration-500 ease-oasis",
          "group-hover:-translate-y-2",
        )}
      >
        <h4
          className={cn(
            "font-display text-[22px] font-semibold leading-[1.1] tracking-[-0.01em] mb-1.5",
          )}
        >
          {item.title[locale]}
        </h4>
        <p
          className={cn(
            "text-[13px] opacity-85 text-cream-deep",
          )}
        >
          {tag}
        </p>
        <span
          aria-hidden
          className={cn(
            "mt-3.5 inline-flex items-center gap-1.5",
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
            "font-mono text-[11px] uppercase tracking-[0.2em] text-ember",
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
            "[&_em]:font-serif [&_em]:italic [&_em]:font-medium [&_em]:text-ember",
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
            "text-[19px] leading-[1.55] text-ink-soft",
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
            "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {items.slice(0, 3).map((item, index) => (
            <Reveal key={item.id}>
              <PortfolioCard
                item={item}
                locale={locale}
                fallbackIndex={index}
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
              "transition-colors duration-300 hover:text-dune",
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
