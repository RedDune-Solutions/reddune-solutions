import { cn } from "@/lib/utils";
import { STATUS_LABELS, type ProjetoStatus } from "@/types/projeto";

const STATUS_CLASSES: Record<ProjetoStatus, string> = {
  proximo: "bg-apricot text-ink border-apricot",
  "em-curso": "bg-ember text-cream border-ember",
  "aguardando-cliente": "bg-peach/60 text-ink-soft border-peach",
  "aguardando-encomenda": "bg-peach text-ink-soft border-peach",
  terminado: "bg-amber-500 text-white border-amber-500",
  fechado: "bg-emerald-600 text-white border-emerald-600",
  cancelado: "bg-ink-mute text-cream border-ink-mute",
};

export function StatusBadge({
  status,
  className,
}: {
  status: ProjetoStatus;
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
