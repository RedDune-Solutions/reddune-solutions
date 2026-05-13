import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

/**
 * Services — Phase 4 Oasis services preview.
 *
 * Direct port of `#servicos-preview` from
 * `design-handoff/project/site/index.html` (lines 60-108).
 *
 * Structure:
 *   • Eyebrow pill (ember tint) + h2 title (with em Newsreader accent) + lead
 *   • 3 service cards as `<a>` (sand-warm bg, rounded-card, hover lift -8px)
 *   • Each card: SVG icon with radial gradient + h3 + meta + ar arrow
 *   • svc-note rail below: ink slab with cream CTA chip
 *
 * Cards use <Reveal> for staggered entrance via IntersectionObserver.
 */

type ServiceKey = "tecAssist" | "webDigital" | "dataRecovery";

type ServiceConfig = {
  key: ServiceKey;
  href: string;
  gradientId: string;
  visual: React.ReactNode;
};

// SVG icon definitions ported 1:1 from the design HTML.
const SERVICES: ReadonlyArray<ServiceConfig> = [
  {
    key: "tecAssist",
    href: "/servicos/assistencia-tecnica",
    gradientId: "svc-g1",
    visual: (
      <svg
        viewBox="0 0 300 225"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <radialGradient id="svc-g1">
            <stop offset="0" stopColor="#ff8a5c" />
            <stop offset="1" stopColor="#d6422a" />
          </radialGradient>
        </defs>
        <circle
          className="icon-blob"
          cx="150"
          cy="120"
          r="60"
          fill="url(#svc-g1)"
          opacity="0.85"
        />
        <rect
          x="80"
          y="140"
          width="140"
          height="6"
          rx="3"
          fill="#5a0e0e"
          opacity="0.5"
        />
        <rect
          x="100"
          y="155"
          width="100"
          height="4"
          rx="2"
          fill="#5a0e0e"
          opacity="0.35"
        />
      </svg>
    ),
  },
  {
    key: "webDigital",
    href: "/servicos/web-digital",
    gradientId: "svc-g2",
    visual: (
      <svg
        viewBox="0 0 300 225"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="svc-g2" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#f3c79b" />
            <stop offset="1" stopColor="#a8201a" />
          </linearGradient>
        </defs>
        <path
          className="icon-blob"
          d="M 60 150 Q 100 50, 150 100 T 240 90 L 240 180 L 60 180 Z"
          fill="url(#svc-g2)"
          opacity="0.9"
        />
        <circle cx="200" cy="80" r="14" fill="#fff7e8" opacity="0.8" />
      </svg>
    ),
  },
  {
    key: "dataRecovery",
    href: "/servicos/software-recuperacao",
    gradientId: "svc-g3",
    visual: (
      <svg
        viewBox="0 0 300 225"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <radialGradient id="svc-g3" cx="0.3" cy="0.3">
            <stop offset="0" stopColor="#ff6b3f" />
            <stop offset="1" stopColor="#5a0e0e" />
          </radialGradient>
        </defs>
        <ellipse
          className="icon-blob"
          cx="150"
          cy="120"
          rx="90"
          ry="55"
          fill="url(#svc-g3)"
          opacity="0.85"
        />
        <circle cx="150" cy="120" r="20" fill="#fff7e8" opacity="0.85" />
        <circle cx="150" cy="120" r="6" fill="#5a0e0e" />
      </svg>
    ),
  },
] as const;

export function Services() {
  const t = useTranslations("HomePage.ServicesSection");

  return (
    <section
      id="servicos-preview"
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
          {t.has("eyebrow") ? t("eyebrow") : "Os nossos serviços"}
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

      <div
        className={cn(
          "services-grid grid gap-5",
          "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {SERVICES.map((svc) => (
          <Reveal key={svc.key}>
            <Link
              href={svc.href}
              className={cn(
                "group flex h-full min-h-[480px] flex-col overflow-hidden",
                "rounded-card bg-sand-warm",
                "px-8 pt-9 pb-8 no-underline text-ink",
                "shadow-warm transition-all duration-500 ease-oasis",
                "hover:-translate-y-2 hover:shadow-warm-lg",
              )}
            >
              {/* Visual */}
              <div
                className={cn(
                  "relative mb-7 overflow-hidden rounded-[20px]",
                  "aspect-[4/3]",
                )}
                style={{
                  background:
                    "linear-gradient(135deg, var(--cream-deep), var(--peach))",
                }}
              >
                {svc.visual}
              </div>

              <h3
                className={cn(
                  "font-display font-bold text-[28px] leading-[1.05] tracking-[-0.02em] mb-3.5",
                  "[&_em]:font-serif [&_em]:italic [&_em]:font-medium [&_em]:text-ember",
                )}
              >
                {t.rich(`services.${svc.key}.title`, {
                  accent: (chunks) => <em>{chunks}</em>,
                })}
              </h3>
              <p
                className={cn(
                  "flex-1 text-[15px] leading-[1.55] text-ink-soft",
                )}
              >
                {t(`services.${svc.key}.description`)}
              </p>

              <div
                className={cn(
                  "mt-6 flex items-center justify-end pt-5",
                  "border-t border-dashed border-dune-deep/15",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "inline-flex h-[38px] w-[38px] items-center justify-center",
                    "rounded-full bg-ink text-cream",
                    "transition-all duration-300 ease-oasis",
                    "group-hover:bg-ember group-hover:rotate-[-45deg]",
                  )}
                >
                  <ArrowRight className="size-[17px]" strokeWidth={2.25} />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div
          className={cn(
            "svc-note mt-7 grid items-center gap-6",
            "grid-cols-1 md:grid-cols-[1fr_auto]",
            "rounded-card bg-ink text-cream",
            "px-8 py-7",
          )}
        >
          <p
            className={cn(
              "max-w-[700px] text-[17px] leading-[1.5]",
              "[&_em]:font-serif [&_em]:italic [&_em]:font-medium [&_em]:text-apricot",
            )}
          >
            {t.rich("quote", {
              accent: (chunks) => <em>{chunks}</em>,
              contactLink: (chunks) => (
                <Link
                  href="/contacto?from=home"
                  className="font-semibold text-cream underline underline-offset-4 decoration-apricot/60 hover:decoration-apricot"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
          <Link
            href="/servicos"
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap",
              "rounded-btn bg-cream text-ink",
              "px-[22px] py-[14px] text-[14px] font-semibold",
              "transition-colors duration-300",
              "hover:bg-apricot",
            )}
          >
            {t("cta")}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
