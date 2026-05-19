"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, type ProjetoStatus, type Projeto } from "@/types/projeto";
import { TarefaCard } from "./TarefaCard";
import { readKanbanOrder, KANBAN_DEFAULT_COLUMNS } from "./KanbanOrderSettings";

const ARCHIVE_STATUSES: ProjetoStatus[] = ["fechado", "cancelado"];

const COLLAPSE_KEY = "painel.kanban.collapsedColumns";

type Props = {
  projetos: Projeto[];
  className?: string;
};

export function KanbanBoard({ projetos, className }: Props) {
  const [collapsed, setCollapsed] = useState<Set<ProjetoStatus>>(new Set());
  const [mainColumns, setMainColumns] = useState<ProjetoStatus[]>(KANBAN_DEFAULT_COLUMNS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSE_KEY);
      if (raw) setCollapsed(new Set(JSON.parse(raw) as ProjetoStatus[]));
    } catch {
      // ignore
    }
    setMainColumns(readKanbanOrder());
  }, []);

  function toggle(status: ProjetoStatus) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      try {
        localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  }

  const grouped: Partial<Record<ProjetoStatus, Projeto[]>> = {};
  for (const projeto of projetos) {
    if (!grouped[projeto.status]) grouped[projeto.status] = [];
    grouped[projeto.status]!.push(projeto);
  }

  const columns = mainColumns.filter(
    (status) =>
      (grouped[status]?.length ?? 0) > 0 ||
      (["em-curso", "proximo"] as ProjetoStatus[]).includes(status)
  );

  const archiveItems = ARCHIVE_STATUSES.flatMap((s) => grouped[s] ?? []);
  const ideiasInternas = grouped["ideia-interna"] ?? [];
  const ideiasCliente = grouped["ideia-cliente"] ?? [];

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex gap-4 overflow-x-auto pb-8 -mx-4 px-4 snap-x snap-mandatory">
        {columns.map((status) => {
          const items = grouped[status] ?? [];
          const isCollapsed = collapsed.has(status);
          return (
            <section
              key={status}
              className={cn(
                "flex-shrink-0 snap-start rounded-card bg-cream/40 border border-dune-deep/8 px-3 pt-3 pb-4 overflow-visible transition-[width] duration-200",
                isCollapsed ? "w-48" : "w-80"
              )}
              aria-label={`Coluna ${STATUS_LABELS[status]}`}
            >
              <div className="flex items-center justify-between mb-3 px-1 gap-2">
                <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft truncate">
                  {STATUS_LABELS[status]}
                </h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-btn bg-cream-deep font-mono text-[10px] tabular-nums text-ink-soft">
                    {items.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(status)}
                    aria-label={isCollapsed ? "Expandir coluna" : "Recolher coluna"}
                    className="inline-flex items-center justify-center h-5 w-5 rounded text-ink-mute hover:text-ink hover:bg-cream-deep transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
              {!isCollapsed && (
                <div className="space-y-4">
                  {items.length === 0 ? (
                    <div className="rounded-card border border-dashed border-dune-deep/15 bg-white/30 p-6 text-center font-mono text-[11px] uppercase tracking-tight text-ink-mute">
                      Vazio
                    </div>
                  ) : (
                    items.map((projeto) => <TarefaCard key={projeto.id} projeto={projeto} />)
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {ideiasCliente.length > 0 && (
        <details className="group" open>
          <summary className="cursor-pointer select-none list-none flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-amber-700 hover:text-amber-900 transition-colors">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            Ideias de clientes ({ideiasCliente.length})
          </summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ideiasCliente.map((projeto) => (
              <TarefaCard key={projeto.id} projeto={projeto} />
            ))}
          </div>
        </details>
      )}

      {ideiasInternas.length > 0 && (
        <details className="group" open>
          <summary className="cursor-pointer select-none list-none flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-violet-700 hover:text-violet-900 transition-colors">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            Ideias internas ({ideiasInternas.length})
          </summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ideiasInternas.map((projeto) => (
              <TarefaCard key={projeto.id} projeto={projeto} />
            ))}
          </div>
        </details>
      )}

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
