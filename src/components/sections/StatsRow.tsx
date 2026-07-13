import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Counter } from "@/components/motion/Counter";
import { cn } from "@/lib/utils";

type StatCellBase = { label: string; sub: string };

type StatCellJson =
  | (StatCellBase & { kind: "counter"; countTo: number })
  | (StatCellBase & { kind: "text"; headline: string })
  | (StatCellBase & {
      kind: "split";
      headline: string;
      headlineSuffix: string;
    });

function isStatCell(v: unknown): v is StatCellJson {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (typeof o.label !== "string" || typeof o.sub !== "string") return false;
  if (o.kind === "counter")
    return typeof o.countTo === "number";
  if (o.kind === "text") return typeof o.headline === "string";
  if (o.kind === "split")
    return (
      typeof o.headline === "string" && typeof o.headlineSuffix === "string"
    );
  return false;
}

/**
 * Stats row — matches `.stats-row` / `.stat-cell` from Iuri `site/index.html`
 * (four cells: animated count, geography, base, audience split).
 */
export function StatsRow() {
  const t = useTranslations("HomePage.StatsRow");
  const raw = t.raw("items");
  const items = Array.isArray(raw)
    ? (raw as unknown[]).filter(isStatCell)
    : [];

  if (items.length === 0) return null;

  const gradientHeadline = cn(
    "inline-block font-display font-bold tracking-[-0.03em]",
    "text-[clamp(48px,5.5vw,80px)] leading-[0.95]",
    "bg-clip-text text-transparent",
  );
  const gradientStyle: CSSProperties = {
    backgroundImage:
      "linear-gradient(135deg, var(--cream) 0%, var(--apricot) 70%, var(--ember) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };

  return (
    <section className="relative mx-auto block w-full max-w-content px-8 py-[120px]">
      <div
        className={cn(
          "stats-row relative grid gap-8 overflow-hidden align-center",
          "grid-cols-1 md:grid-cols-2 xl:grid-cols-4",
          "rounded-card bg-ink text-cream",
          "px-2 py-[40px] sm:px-12 sm:py-[60px]",
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-36 z-0 h-[500px] w-[500px] rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(circle, var(--ember), transparent 60%)",
            animation: "glow 5s ease-in-out infinite",
          }}
        />

        {items.map((cell, index) => (
          <div
            key={`${cell.kind}-${index}`}
            className="relative z-[1] flex flex-col items-center md:items-start text-center md:text-left"
          >
            <div
              className={cn(
                cell.kind === "split" &&
                  "flex flex-wrap items-baseline gap-0 font-display font-bold",
              )}
            >
              {cell.kind === "counter" ? (
                <span className={gradientHeadline} style={gradientStyle}>
                  <Counter to={cell.countTo} />
                </span>
              ) : cell.kind === "split" ? (
                <>
                  <span className={gradientHeadline} style={gradientStyle}>
                    {cell.headline}
                  </span>
                  <span className="font-display font-bold text-apricot text-[clamp(22px,3vw,44px)]">
                    {cell.headlineSuffix}
                  </span>
                </>
              ) : (
                <span className={gradientHeadline} style={gradientStyle}>
                  {cell.headline}
                </span>
              )}
            </div>
            <label className="mt-3 block text-sm font-medium text-cream-deep">
              {cell.label}
            </label>
            <div
              className={cn(
                "mt-1.5 font-mono text-[11px] uppercase tracking-[0.15em]",
                "text-ink-mute",
              )}
            >
              {cell.sub}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
