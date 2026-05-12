import { useTranslations } from "next-intl";
import { Counter } from "@/components/motion/Counter";
import { cn } from "@/lib/utils";

/**
 * StatsRow — Phase 4 Oasis stats slab.
 *
 * Direct port of `.stats-row` from
 * `design-handoff/project/site/index.html` (lines 135-142) +
 * `design-handoff/project/site/styles.css` (lines 616-666).
 *
 * Ink-bg slab inside a section.block frame, 4 cells with an apricot/ember
 * gradient number plus a cream label. A radial `glow` halo pulses behind the
 * top-right corner (handled via the `.stats-glow` ::before utility).
 *
 * The numbers use <Counter/> for IntersectionObserver-driven count-up. Stat
 * value strings are parsed to a numeric `to` + textual `suffix` (e.g. "10+",
 * "24h", "3 anos") so the count animation still works for non-pure-numbers.
 */

type Stat = { value: string; label: string };

// Split "10+", "24h", "3 anos" → { to: 10, suffix: "+" | "h" | " anos" }.
// Returns to=null when no leading number — we render the raw string instead.
function parseStat(value: string): { to: number | null; suffix: string } {
  const match = value.trim().match(/^(\d+)(.*)$/);
  if (!match) return { to: null, suffix: value };
  return { to: parseInt(match[1], 10), suffix: match[2] };
}

export function StatsRow() {
  const t = useTranslations("HomePage.TrustStrip");
  const statsRaw = t.raw("stats");
  const stats = Array.isArray(statsRaw) ? (statsRaw as Stat[]) : [];

  if (stats.length === 0) return null;

  return (
    <section className="relative mx-auto w-full max-w-content px-8 py-[120px]">
      <div
        className={cn(
          "relative grid gap-8 overflow-hidden",
          "grid-cols-2 md:grid-cols-4",
          "rounded-card bg-ink text-cream",
          "px-12 py-[60px]",
        )}
      >
        {/* Glow halo — animates via the `glow` keyframe in globals.css */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-36 z-0 h-[500px] w-[500px] rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(circle, var(--ember), transparent 60%)",
            animation: "glow 5s ease-in-out infinite",
          }}
        />

        {stats.map((stat) => {
          const { to, suffix } = parseStat(stat.value);
          return (
            <div key={stat.label} className="relative z-[1]">
              <div
                className={cn(
                  "font-display font-bold tracking-[-0.03em]",
                  "text-[clamp(48px,5.5vw,80px)] leading-[0.95]",
                  "bg-clip-text text-transparent",
                )}
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--cream) 0%, var(--apricot) 70%, var(--ember) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {to !== null ? (
                  <Counter to={to} suffix={suffix} />
                ) : (
                  stat.value
                )}
              </div>
              <div className="mt-3 text-sm font-medium text-cream-deep">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
