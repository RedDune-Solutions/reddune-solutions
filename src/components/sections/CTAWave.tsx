import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";
import { EMAIL } from "@/lib/constants";

/**
 * CTAWave — Phase 4 Oasis closing CTA slab.
 *
 * Direct port of `.cta-wave` from
 * `design-handoff/project/site/index.html` (lines 171-183) +
 * `design-handoff/project/site/styles.css` (lines 768-840).
 *
 * Diagonal ember → dune-deep gradient slab with a `ctapulse` radial halo
 * (positioned at the top, centered) and a decorative cream wave at the
 * bottom. Inside: h2 with em accent, a paragraph, and two CTA chips
 * (cream → ink primary + transparent outlined secondary).
 *
 * Replaces the previous `ContactCTA` component (which was a flat slab with
 * different palette) — the new component reuses the same i18n keys
 * (`HomePage.ContactCTA.*`) so message files don't need to change.
 */
export function CTAWave() {
  const t = useTranslations("HomePage.ContactCTA");

  return (
    <section
      id="contacto"
      className="mx-auto my-20 mb-[60px] block w-full max-w-content px-8"
    >
      <Reveal>
        <div
          className={cn(
            "cta-wave relative overflow-hidden rounded-[40px]",
            "px-[60px] py-[100px]",
            "text-center text-cream",
          )}
          style={{
            background:
              "linear-gradient(160deg, #d6422a 0%, #a8201a 50%, #5a0e0e 100%)",
          }}
        >
          {/* Radial pulse halo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-[200px] left-1/2 -translate-x-1/2 h-[800px] w-[800px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,107,63,0.5), transparent 60%)",
              animation: "ctapulse 4s ease-in-out infinite",
            }}
          />

          {/* Decorative wave at the bottom */}
          <svg
            aria-hidden="true"
            viewBox="0 0 1920 200"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-0 w-full opacity-35"
          >
            <path
              d="M 0 100 C 320 60, 640 140, 960 100 C 1280 60, 1600 140, 1920 100 L 1920 200 L 0 200 Z"
              fill="#fff7e8"
            />
          </svg>

          {/* Content */}
          <div className="relative z-[1] mx-auto max-w-[900px]">
            <h2
              className={cn(
                "font-display font-bold mb-7",
                "text-[clamp(48px,7vw,110px)] leading-[0.98] tracking-[-0.035em]",
                "[&_em]:font-serif [&_em]:italic [&_em]:font-medium [&_em]:text-apricot",
              )}
            >
              {t.rich("title", {
                accent: (chunks) => <em>{chunks}</em>,
                br: () => <br />,
              })}
            </h2>
            <p
              className={cn(
                "mx-auto max-w-[600px] mb-10",
                "text-[19px] leading-[1.55] text-cream-deep",
              )}
            >
              {t("description")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-[14px] cta-wave-actions">
              <Link
                href="/contacto?from=home"
                className={cn(
                  "group inline-flex items-center gap-3",
                  "rounded-btn bg-cream px-8 py-5",
                  "text-[15px] font-semibold text-ink",
                  "transition-all duration-300",
                  "hover:bg-apricot hover:scale-[1.04]",
                )}
              >
                {t("cta")}
                <span
                  aria-hidden
                  className="inline-block transition-transform duration-300 group-hover:rotate-[-45deg]"
                >
                  <ArrowRight className="size-[18px]" strokeWidth={2.25} />
                </span>
              </Link>
              <a
                href={`mailto:${EMAIL}`}
                className={cn(
                  "inline-flex items-center",
                  "rounded-btn border border-cream/40 bg-transparent",
                  "px-[30px] py-5",
                  "text-[15px] font-medium text-cream",
                  "transition-all duration-300",
                  "hover:bg-cream/10 hover:border-cream",
                )}
              >
                {EMAIL}
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
