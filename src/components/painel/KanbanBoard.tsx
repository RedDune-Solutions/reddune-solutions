"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, type ProjetoStatus, type Projeto } from "@/types/projeto";
import { TarefaCard } from "./TarefaCard";
import { readKanbanOrder, KANBAN_DEFAULT_COLUMNS } from "./KanbanOrderSettings";

const ARCHIVE_STATUSES: ProjetoStatus[] = ["fechado", "cancelado"];

const STATUS_DOT: Record<ProjetoStatus, string> = {
  "ideia-interna": "#5b4a3a",
  "ideia-cliente": "#5b4a3a",
  proximo: "#2f4d6e",
  "em-curso": "var(--ember)",
  "aguardando-cliente": "#8a5a13",
  "aguardando-encomenda": "#8a5a13",
  terminado: "#3f6a4d",
  fechado: "#466a4f",
  cancelado: "#6e3a2a",
};

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
    <div className={cn("col", className)} style={{ gap: 24 }}>
      <div
        className="kanban"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(240px, 1fr))` }}
      >
        {columns.map((status) => {
          const items = grouped[status] ?? [];
          const isCollapsed = collapsed.has(status);
          return (
            <div key={status} className="kanban-col" aria-label={`Coluna ${STATUS_LABELS[status]}`}>
              <div className="h">
                <span className="name">
                  <span className="dot" style={{ background: STATUS_DOT[status] ?? "var(--ink-mute)" }} />
                  {STATUS_LABELS[status]}
                </span>
                <span className="ct" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {items.length}
                  <button
                    type="button"
                    onClick={() => toggle(status)}
                    aria-label={isCollapsed ? "Expandir coluna" : "Recolher coluna"}
                    className="text-ink-mute hover:text-ink"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                </span>
              </div>
              {!isCollapsed &&
                (items.length === 0 ? (
                  <div className="add">Vazio</div>
                ) : (
                  items.map((projeto) => <TarefaCard key={projeto.id} projeto={projeto} />)
                ))}
            </div>
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
