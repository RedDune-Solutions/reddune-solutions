import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * TrustStrip — Phase 4 Oasis "/ para quem trabalhamos" strip.
 *
 * Direct port of `.trusted` from
 * `design-handoff/project/site/index.html` (lines 53-58).
 *
 * Layout: centered label (Geist Mono uppercase) on top, then a row of three
 * audience chips (Bricolage display 600) separated by ember dots via
 * `.trusted-row` rules in `globals.css` (MOBILE-UPDATE).
 */
export function TrustStrip() {
  const t = useTranslations("HomePage.TrustStrip");
  const audiencesRaw = t.raw("audiences");
  const audiences = Array.isArray(audiencesRaw)
    ? (audiencesRaw as string[])
    : ["Particulares", "Empresas", "Qualquer pessoa com um problema"];

  return (
    <section
      aria-label="Para quem trabalhamos"
      className="trusted relative z-[5] px-8 pt-6 pb-[60px] text-center"
    >
      <div
        className={cn(
          "mb-5 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute",
        )}
      >
        {t("tagline")}
      </div>
      <div
        className={cn(
          "trusted-row flex flex-wrap items-center justify-center gap-x-12 gap-y-3",
          "font-display text-[18px] font-semibold text-ink-mute opacity-85",
        )}
      >
        {audiences.map((audience) => (
          <span key={audience}>{audience}</span>
        ))}
      </div>
    </section>
  );
}
