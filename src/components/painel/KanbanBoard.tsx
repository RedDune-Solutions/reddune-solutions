import { cn } from "@/lib/utils";
import { STATUS_LABELS, type TarefaStatus, type TarefaPublic } from "@/types/tarefa";
import { TarefaCard } from "./TarefaCard";

const COLUMN_ORDER: TarefaStatus[] = [
  "em-curso",
  "proximo",
  "aguarda-cliente",
  "aguarda-pecas",
  "aguarda-fornecedor",
  "pronto",
  "fechado",
];

type Props = {
  tarefas: TarefaPublic[];
  className?: string;
};

export function KanbanBoard({ tarefas, className }: Props) {
  const grouped: Partial<Record<TarefaStatus, TarefaPublic[]>> = {};
  for (const tarefa of tarefas) {
    if (!grouped[tarefa.status]) grouped[tarefa.status] = [];
    grouped[tarefa.status]!.push(tarefa);
  }

  // Filter columns to only those with tarefas, plus em-curso/proximo/aguardas always
  const columns = COLUMN_ORDER.filter(
    (status) =>
      (grouped[status]?.length ?? 0) > 0 ||
      ["em-curso", "proximo"].includes(status)
  );

  return (
    <div
      className={cn(
        "flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory",
        className
      )}
    >
      {columns.map((status) => {
        const items = grouped[status] ?? [];
        return (
          <section
            key={status}
            className="flex-shrink-0 w-80 snap-start rounded-card bg-cream/40 border border-dune-deep/8 p-3"
            aria-label={`Coluna ${STATUS_LABELS[status]}`}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
                {STATUS_LABELS[status]}
              </h3>
              <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-btn bg-cream-deep font-mono text-[10px] tabular-nums text-ink-soft">
                {items.length}
              </span>
            </div>
            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="rounded-card border border-dashed border-dune-deep/15 bg-white/30 p-6 text-center font-mono text-[11px] uppercase tracking-tight text-ink-mute">
                  Vazio
                </div>
              ) : (
                items.map((tarefa) => <TarefaCard key={tarefa.id} tarefa={tarefa} />)
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
