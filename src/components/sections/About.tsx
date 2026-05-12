import { useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

/**
 * About — Phase 4 Oasis about section.
 *
 * Direct port of `#sobre` from
 * `design-handoff/project/site/index.html` (lines 144-169) +
 * `design-handoff/project/site/styles.css` (lines 668-766).
 *
 * Layout:
 *   • Left col: visual slab (gradient bg) with Google Maps iframe (sepia
 *     filter), a badge top-left and a signature bottom (Newsreader italic
 *     place + Geist Mono coord).
 *   • Right col: eyebrow + h2 (em accent) + body paragraphs + values row
 *     (01./02./03. — Confiança/Eficiência/Transparência).
 */
export function About() {
  const t = useTranslations("HomePage.AboutUsSection");

  return (
    <section
      id="sobre"
      className="relative mx-auto w-full max-w-content px-8 py-[120px]"
    >
      <div
        className={cn(
          "grid gap-12 md:gap-20 items-center",
          "grid-cols-1 md:grid-cols-[1fr_1.1fr]",
        )}
      >
        {/* Visual */}
        <Reveal>
          <div
            className={cn(
              "relative overflow-hidden rounded-card",
              "aspect-[1/1.2]",
              "shadow-[0_30px_80px_rgba(90,14,14,0.25)]",
            )}
            style={{
              background:
                "linear-gradient(160deg, #d6422a 0%, #5a0e0e 70%, #2a0805 100%)",
            }}
          >
            {/* Badge top-left */}
            <span
              className={cn(
                "absolute left-6 top-6 z-[3]",
                "rounded-btn bg-white/85 backdrop-blur",
                "px-4 py-2.5",
                "font-mono text-[11px] uppercase tracking-[0.15em] text-ink",
              )}
            >
              {t.has("badge") ? t("badge") : "Fuseta · Algarve"}
            </span>

            {/* Google Maps iframe with sepia filter */}
            <iframe
              src="https://www.google.com/maps?q=Fuseta,+Algarve,+Portugal&t=&z=14&ie=UTF8&iwloc=&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização — Fuseta, Algarve"
              className="absolute inset-0 h-full w-full"
              style={{
                border: 0,
                filter: "contrast(1.05) saturate(0.85) sepia(0.18)",
              }}
            />

            {/* Subtle dark overlay for text legibility */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[2]"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,107,63,0.18) 0%, transparent 35%, transparent 60%, rgba(42,8,5,0.55) 100%)",
              }}
            />

            {/* Signature bottom */}
            <div className="absolute inset-x-7 bottom-7 z-[3] text-cream">
              <div
                className={cn(
                  "font-serif italic font-medium",
                  "text-[32px] leading-[1.1] mb-2",
                )}
              >
                {t.has("placeLabel") ? t("placeLabel") : "A nossa casa."}
              </div>
              <div
                className={cn(
                  "font-mono text-[11px] uppercase tracking-[0.15em] opacity-85",
                )}
              >
                37.0556°N · 7.7445°W · Fuseta, PT
              </div>
            </div>
          </div>
        </Reveal>

        {/* Text */}
        <div>
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
              {t.has("eyebrow") ? t("eyebrow") : "Sobre nós"}
            </span>
          </Reveal>
          <Reveal>
            <h2
              className={cn(
                "font-display font-bold text-ink",
                "text-[clamp(36px,4.5vw,64px)] leading-[1.05] tracking-[-0.03em] mb-6",
                "[&_em]:font-serif [&_em]:italic [&_em]:font-medium [&_em]:text-ember",
              )}
            >
              {t.rich("title", {
                accent: (chunks) => <em>{chunks}</em>,
              })}
            </h2>
          </Reveal>
          <Reveal>
            <p
              className={cn(
                "max-w-[540px] mb-4 text-[17px] leading-[1.6] text-ink-soft",
                "[&_strong]:font-semibold [&_strong]:text-ink",
              )}
            >
              {t.rich("description", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
          </Reveal>
          {t.has("description2") && (
            <Reveal>
              <p
                className={cn(
                  "max-w-[540px] mb-4 text-[17px] leading-[1.6] text-ink-soft",
                  "[&_strong]:font-semibold [&_strong]:text-ink",
                )}
              >
                {t.rich("description2", {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </Reveal>
          )}

          <Reveal>
            <div
              className={cn(
                "mt-9 grid grid-cols-3 gap-4 pt-9",
                "border-t border-dune-deep/15",
              )}
            >
              {[
                { lbl: "01.", v: t.has("value1") ? t("value1") : "Confiança" },
                {
                  lbl: "02.",
                  v: t.has("value2") ? t("value2") : "Eficiência",
                },
                {
                  lbl: "03.",
                  v: t.has("value3") ? t("value3") : "Transparência",
                },
              ].map((val) => (
                <div key={val.lbl}>
                  <div
                    className={cn(
                      "font-mono text-[10px] uppercase tracking-[0.18em] text-ember mb-2",
                    )}
                  >
                    {val.lbl}
                  </div>
                  <div className="font-display text-[18px] font-semibold text-ink">
                    {val.v}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
