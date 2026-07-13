"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { PortfolioItem } from "@/types/portfolio";

/**
 * PortfolioCardShared — visual card único usado pela landing (Portfolio.tsx) e
 * pelo /portfolio (PortfolioGrid.tsx). Sem fixar aspect-ratio nem altura —
 * o container externo decide via `className`.
 */

type Props = {
  item: PortfolioItem;
  locale: "pt" | "en";
  tag: string;
  /** Título exibido no h3. Default: item.title[locale]. */
  displayTitle?: string;
  /** Força um href fixo ignorando item.url. */
  hrefOverride?: string;
  fallbackBg: string;
  className?: string;
  style?: React.CSSProperties;
  hrefFallback?: string;
  imageSizes?: string;
};

export function PortfolioCardShared({
  item,
  locale,
  tag,
  displayTitle,
  hrefOverride,
  fallbackBg,
  className,
  style,
  hrefFallback,
  imageSizes,
}: Props) {
  const t = useTranslations("PortfolioPage");
  const image = item.imageUrl;
  const href = hrefOverride ?? (item.url || hrefFallback || "/contacto");
  const title = displayTitle ?? item.title[locale];

  return (
    <Link
      href={href}
      target={!hrefOverride && item.url ? "_blank" : undefined}
      rel={!hrefOverride && item.url ? "noopener noreferrer" : undefined}
      aria-label={item.title[locale]}
      className={cn(
        "group relative block overflow-hidden rounded-[28px]",
        "shadow-warm transition-all duration-700 ease-oasis",
        "hover:-translate-y-2.5 hover:scale-[1.015] hover:shadow-warm-lg",
        "no-underline text-ink",
        className
      )}
      style={{
        background: image ? "var(--cream-deep)" : fallbackBg,
        ...style,
      }}
    >
      {image ? (
        <Image
          src={image}
          alt={item.title[locale]}
          fill
          sizes={imageSizes ?? "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"}
          className={cn(
            "absolute inset-0 object-cover transition-transform duration-700 ease-oasis",
            "group-hover:scale-[1.08]"
          )}
        />
      ) : null}

      {/* Bottom darkening gradient */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          "bg-gradient-to-b from-transparent via-ink/50 via-65% to-ink"
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
          "group-hover:bg-apricot group-hover:translate-x-0.5 group-hover:-translate-y-1"
        )}
      >
        {tag}
      </span>

      {/* Info block (bottom) */}
      <div
        className={cn(
          "absolute inset-x-6 bottom-6 z-[4] text-cream",
          "transition-transform duration-500 ease-oasis",
          "group-hover:-translate-y-2"
        )}
      >
        <h3
          className={cn(
            "font-display text-[22px] md:text-[26px] font-semibold leading-[1.1] tracking-[-0.01em] mb-1.5",
            "[text-shadow:0_2px_8px_rgba(0,0,0,0.6)]"
          )}
        >
          {title}
        </h3>
        <p className="text-[13px] opacity-85 text-cream-deep">{tag}</p>
        <span
          aria-hidden
          className={cn(
            "mt-3.5 inline-flex items-center gap-1.5",
            "font-mono text-[11px] uppercase tracking-[0.15em] text-apricot",
            "opacity-0 translate-y-3 transition-all duration-500 ease-oasis",
            "group-hover:opacity-100 group-hover:translate-y-0"
          )}
        >
          {t("viewProject")}
          <ArrowRight className="size-3 shrink-0" strokeWidth={2.25} />
        </span>
      </div>
    </Link>
  );
}

// Backgrounds default por categoria (usado como fallback quando sem imagem).
export const CATEGORIA_FALLBACK_BG: Record<string, string> = {
  "assistencia-tecnica":
    "radial-gradient(circle at 30% 30%, #ff8a5c, var(--ember) 40%, var(--dune-deep) 80%)",
  "web-digital": "linear-gradient(135deg, #ecdfc2, #b88a5c 50%, #5a3a26)",
  "software-recuperacao":
    "radial-gradient(circle at 70% 30%, #f4a76a, #b3221c 50%, #2a0805 90%)",
};

export const DEFAULT_FALLBACK_BG =
  "radial-gradient(circle at 30% 30%, #ff8a5c, var(--ember) 40%, var(--dune-deep) 80%)";
