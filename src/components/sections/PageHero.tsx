import { Sun } from "@/components/motion/Sun";
import { Sparks } from "@/components/motion/Sparks";
import { Breadcrumb, type Crumb } from "@/components/sections/Breadcrumb";
import { cn } from "@/lib/utils";

type Props = {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Breadcrumb dentro da pill do hero (substitui o antigo eyebrow). Todas as
   *  páginas internas o passam; só a home não tem hero interno. Vazio = sem pill. */
  breadcrumb?: Crumb[];
};

/**
 * PageHero — Phase 5 Oasis HeroLite for internal pages.
 *
 * Compact version of the home Hero: shorter padding, no dunes, but keeps the
 * sun glow + drifting sparks for visual continuity. Title supports an <em>
 * Newsreader accent and uses the same display sizing as Hero (slightly smaller).
 *
 * Direct port of `section.hero` (compact variant) used in
 * `design-handoff/project/site/{servicos,portfolio,loja,contacto,politica-privacidade}/index.html`.
 * The HTML inlines `style="min-height:auto;padding:180px 32px 60px;"` on the
 * hero section to suppress min-height: 100vh — same idea here via classes.
 */
export function PageHero({ title, description, breadcrumb }: Props) {
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        "pt-[180px] pb-[60px] px-8",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        aria-hidden="true"
      >
        <Sun size="sm" />
        <Sparks />
      </div>

      <div className="relative z-[5] mx-auto w-full max-w-content text-center">
        {breadcrumb && breadcrumb.length > 0 && (
          <div
            className={cn(
              "hero-kicker inline-flex items-center gap-[10px]",
              "px-4 py-2 mb-7",
              "rounded-btn border border-dune-deep/10",
              "bg-white/50 backdrop-blur",
              "font-mono text-[11px] uppercase tracking-[0.15em] text-ink-soft",
            )}
          >
            <span className="pulse" aria-hidden="true" />
            <Breadcrumb items={breadcrumb} />
          </div>
        )}

        <h1
          className={cn(
            "font-display font-bold text-ink mx-auto",
            "max-w-[1100px] mb-6",
            "text-[clamp(40px,6.5vw,96px)] leading-[1] tracking-[-0.035em]",
            "[&_em]:font-serif [&_em]:italic [&_em]:font-medium [&_em]:text-ember",
          )}
          style={{ fontVariationSettings: '"opsz" 96' }}
        >
          {title}
        </h1>

        {description && (
          <p
            className={cn(
              "mx-auto max-w-[640px]",
              "text-[17px] md:text-[19px] leading-[1.55] text-ink-soft",
            )}
          >
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
