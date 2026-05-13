import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

type Tone = "default" | "accent" | "amber" | "green";

/**
 * Oasis-toned icon chips for KpiCard. Bg is a 12-15% tint so the icon
 * pops without competing with the headline number.
 */
const TONE_CLASSES: Record<Tone, string> = {
  default: "bg-ember/12 text-ember",
  accent: "bg-apricot/20 text-dune-deep",
  amber: "bg-peach/40 text-dune-deep",
  green: "bg-emerald-500/15 text-emerald-700",
};

type Props = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  tone?: Tone;
  className?: string;
};

export function KpiCard({ label, value, icon: Icon, hint, tone = "default", className }: Props) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-card border border-dune-deep/10 bg-sand-warm/70 p-5 shadow-warm",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-warm-lg",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-mute">
            {label}
          </p>
          <p className="mt-3 font-display text-3xl md:text-4xl font-semibold tabular-nums leading-none text-ink">
            {value}
          </p>
          {hint && (
            <p className="mt-2 text-xs text-ink-mute">{hint}</p>
          )}
        </div>
        <div
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-lg",
            TONE_CLASSES[tone]
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
