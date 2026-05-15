import { cn } from "@/lib/utils";
import { STATUS_LABELS, type TarefaStatus } from "@/types/tarefa";

/**
 * Oasis status palette — mirrors src/lib/chart-theme.ts oasisStatusColors.
 * Backgrounds are solid (no /10 opacity tricks) because pills sit on cream
 * cards/columns and need readable contrast.
 *
 * - em-curso     → ember on cream     (active fire)
 * - proximo      → apricot on ink     (next in line)
 * - aguarda-*    → peach on ink-soft  (parked, warm muted)
 * - pronto       → emerald on white   (semantic green-for-done)
 * - fechado      → ink-mute on cream  (archived)
 * - cancelado    → dune on cream      (negative outcome)
 * - garantia     → cream-deep on ink-soft (warranty / soft hold)
 * - suspenso     → ink-mute on cream
 * - bloqueado    → dune-deep on cream (blocked, heavy)
 */
const STATUS_CLASSES: Record<TarefaStatus, string> = {
  proximo: "bg-apricot text-ink border-apricot",
  "em-curso": "bg-ember text-cream border-ember",
  "aguarda-cliente": "bg-peach text-ink-soft border-peach",
  "aguarda-pecas": "bg-peach text-ink-soft border-peach",
  "aguarda-fornecedor": "bg-peach text-ink-soft border-peach",
  pronto: "bg-emerald-500 text-white border-emerald-500",
  fechado: "bg-ink-mute text-cream border-ink-mute",
  cancelado: "bg-dune text-cream border-dune",
  garantia: "bg-cream-deep text-ink-soft border-cream-deep",
  suspenso: "bg-ink-mute text-cream border-ink-mute",
  bloqueado: "bg-dune-deep text-cream border-dune-deep",
  "em-divida": "bg-dune-deep text-cream border-dune-deep",
};

export function StatusBadge({
  status,
  className,
}: {
  status: TarefaStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-btn border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-tight tabular-nums",
        STATUS_CLASSES[status],
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
