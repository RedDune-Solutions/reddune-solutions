import { cn } from "@/lib/utils";
import { STATUS_LABELS, type ProjetoStatus } from "@/types/projeto";

/**
 * Map prod ProjetoStatus → Oasis design badge class (painel.css .badge.<x>).
 * Design collapses the two "ideia" variants into one tone.
 */
const STATUS_TO_DESIGN: Record<ProjetoStatus, string> = {
  "ideia-interna": "ideia",
  "ideia-cliente": "ideia",
  proximo: "proximo",
  "em-curso": "curso",
  "aguardando-cliente": "aguarda-cliente",
  "aguardando-encomenda": "aguarda-encomenda",
  terminado: "terminado",
  fechado: "fechado",
  cancelado: "cancelado",
};

export function StatusBadge({
  status,
  className,
}: {
  status: ProjetoStatus;
  className?: string;
}) {
  return (
    <span className={cn("badge", STATUS_TO_DESIGN[status], className)}>
      <span className="dot" aria-hidden="true" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
