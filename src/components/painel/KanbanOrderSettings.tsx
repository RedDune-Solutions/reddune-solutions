"use client";

import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS, type ProjetoStatus } from "@/types/projeto";

export const KANBAN_DEFAULT_COLUMNS: ProjetoStatus[] = [
  "em-curso",
  "proximo",
  "aguardando-cliente",
  "aguardando-encomenda",
  "terminado",
];

export const KANBAN_ORDER_KEY = "painel.kanban.columnOrder";

export function readKanbanOrder(): ProjetoStatus[] {
  try {
    const raw = localStorage.getItem(KANBAN_ORDER_KEY);
    if (!raw) return KANBAN_DEFAULT_COLUMNS;
    const parsed = JSON.parse(raw) as ProjetoStatus[];
    // ensure all default columns are present (handles new columns added later)
    const set = new Set(parsed);
    const missing = KANBAN_DEFAULT_COLUMNS.filter((c) => !set.has(c));
    return [...parsed, ...missing];
  } catch {
    return KANBAN_DEFAULT_COLUMNS;
  }
}

export function writeKanbanOrder(order: ProjetoStatus[]) {
  try {
    localStorage.setItem(KANBAN_ORDER_KEY, JSON.stringify(order));
  } catch {}
}

export function KanbanOrderSettings() {
  const [columns, setColumns] = useState<ProjetoStatus[]>(KANBAN_DEFAULT_COLUMNS);

  useEffect(() => {
    setColumns(readKanbanOrder());
  }, []);

  function move(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= columns.length) return;
    const next = [...columns];
    [next[idx], next[target]] = [next[target]!, next[idx]!];
    setColumns(next);
    writeKanbanOrder(next);
  }

  function reset() {
    localStorage.removeItem(KANBAN_ORDER_KEY);
    setColumns(KANBAN_DEFAULT_COLUMNS);
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-1.5">
        {columns.map((status, idx) => (
          <li
            key={status}
            className="flex items-center gap-3 rounded-md border border-border-strong bg-background px-3 py-2"
          >
            <span className="flex-1 text-sm font-medium">{STATUS_LABELS[status]}</span>
            <span className="text-[10px] text-muted-foreground tabular-nums">{idx + 1}</span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                className="h-7 w-7 p-0"
                aria-label={`Mover ${STATUS_LABELS[status]} para cima`}
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => move(idx, 1)}
                disabled={idx === columns.length - 1}
                className="h-7 w-7 p-0"
                aria-label={`Mover ${STATUS_LABELS[status]} para baixo`}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex justify-end pt-2">
        <Button size="sm" variant="outline" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Repor ordem inicial
        </Button>
      </div>
    </div>
  );
}
