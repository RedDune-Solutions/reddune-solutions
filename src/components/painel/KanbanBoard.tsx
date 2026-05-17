import { cn } from "@/lib/utils";
import { STATUS_LABELS, type ProjetoStatus, type Projeto } from "@/types/projeto";
import { TarefaCard } from "./TarefaCard";

const MAIN_COLUMNS: ProjetoStatus[] = [
  "em-curso",
  "proximo",
  "aguardando",
  "terminado",
];

const ARCHIVE_STATUSES: ProjetoStatus[] = ["fechado", "cancelado"];

type Props = {
  projetos: Projeto[];
  className?: string;
};

export function KanbanBoard({ projetos, className }: Props) {
  const grouped: Partial<Record<ProjetoStatus, Projeto[]>> = {};
  for (const projeto of projetos) {
    if (!grouped[projeto.status]) grouped[projeto.status] = [];
    grouped[projeto.status]!.push(projeto);
  }

  const columns = MAIN_COLUMNS.filter(
    (status) =>
      (grouped[status]?.length ?? 0) > 0 ||
      (["em-curso", "proximo"] as ProjetoStatus[]).includes(status)
  );

  const archiveItems = ARCHIVE_STATUSES.flatMap((s) => grouped[s] ?? []);

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
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
                  items.map((projeto) => <TarefaCard key={projeto.id} projeto={projeto} />)
                )}
              </div>
            </section>
          );
        })}
      </div>

      {archiveItems.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer select-none list-none flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-ink-mute hover:text-ink-soft transition-colors">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            Arquivo ({archiveItems.length})
          </summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ARCHIVE_STATUSES.map((status) => {
              const items = grouped[status] ?? [];
              if (items.length === 0) return null;
              return items.map((projeto) => (
                <TarefaCard key={projeto.id} projeto={projeto} />
              ));
            })}
          </div>
        </details>
      )}
    </div>
  );
}
