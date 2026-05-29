import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";
import { Sparkline } from "./Sparkline";

type Tone = "default" | "accent" | "amber" | "green" | "ink";

type Delta = { text: string; dir?: "up" | "down" };

type Props = {
  label: string;
  /** Value. May contain markup (e.g. <em> accent on ink tone). */
  value: number | string;
  icon?: LucideIcon;
  /** Hint line below the value. May contain markup. */
  hint?: string;
  /** Small unit appended to value (e.g. "€"). */
  unit?: string;
  /** Trend chip. Decorative until backed by real series. */
  delta?: Delta;
  /** Decorative mini trend line. Pass real series when available. */
  spark?: { data?: number[]; color?: string };
  tone?: Tone;
  className?: string;
};

/**
 * KpiCard — Oasis v5. Big Poppins value, mono label, tinted icon chip,
 * tone gradients (accent/amber/green/ink), optional unit/delta/sparkline.
 * Styling lives in painel.css (.kpi). Markup mirrors the design handoff.
 */
export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  unit,
  delta,
  spark,
  tone = "default",
  className,
}: Props) {
  return (
    <div className={cn("kpi", tone !== "default" && tone, className)}>
      <div className="row1">
        <div className="label">{label}</div>
        {Icon && (
          <div className="ic">
            <Icon aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="v">
        {value}
        {unit && <span className="unit">{unit}</span>}
      </div>
      {(hint || delta) && (
        <div className="hint">
          {delta && <span className={cn("delta", delta.dir)}>{delta.text}</span>}
          {hint && <span dangerouslySetInnerHTML={{ __html: hint }} />}
        </div>
      )}
      {spark && <Sparkline className="spark" data={spark.data} color={spark.color} />}
    </div>
  );
}
