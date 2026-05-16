import { cn } from "@/lib/utils";
import { STATUS_LABELS, type ProjetoStatus } from "@/types/projeto";

const STATUS_CLASSES: Record<ProjetoStatus, string> = {
  proximo: "bg-apricot text-ink border-apricot",
  "em-curso": "bg-ember text-cream border-ember",
  "aguarda-cliente": "bg-peach text-ink-soft border-peach",
  "aguarda-pecas": "bg-peach text-ink-soft border-peach",
  "aguarda-fornecedor": "bg-peach text-ink-soft border-peach",
  pronto: "bg-emerald-500 text-white border-emerald-500",
  entregue: "bg-teal-500 text-white border-teal-500",
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
