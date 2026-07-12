"use client";

import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import { STATUS_LABELS, type ProjetoStatus } from "@/types/projeto";

const moveBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 1,
  borderRadius: 4,
  background: "none",
  border: 0,
  color: "inherit",
  cursor: "pointer",
};

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
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {columns.map((status, idx) => (
          <span key={status} className="chip">
            {STATUS_LABELS[status]}
            <button
              type="button"
              onClick={() => move(idx, -1)}
              disabled={idx === 0}
              style={{ ...moveBtnStyle, opacity: idx === 0 ? 0.35 : 1 }}
              aria-label={`Mover ${STATUS_LABELS[status]} para trás`}
            >
              <ChevronUp size={12} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => move(idx, 1)}
              disabled={idx === columns.length - 1}
              style={{ ...moveBtnStyle, opacity: idx === columns.length - 1 ? 0.35 : 1 }}
              aria-label={`Mover ${STATUS_LABELS[status]} para a frente`}
            >
              <ChevronDown size={12} aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <button type="button" className="btn-ghost" onClick={reset}>
          <RotateCcw aria-hidden="true" style={{ width: 14, height: 14 }} />
          Repor ordem inicial
        </button>
      </div>
    </>
  );
}
