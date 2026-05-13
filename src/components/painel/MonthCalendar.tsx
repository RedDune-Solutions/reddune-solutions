import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  daysInMonth,
  firstWeekdayOfMonth,
  isToday,
  parseIsoDate,
} from "@/lib/dates";
import type { TarefaPublic, TarefaStatus } from "@/types/tarefa";

type Props = {
  year: number;
  monthIndex: number;
  tarefas: TarefaPublic[];
};

const DAYS_HEADER = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

/**
 * Oasis status dots — mirrors oasisStatusColors from lib/chart-theme but
 * uses Tailwind tokens directly (utility-first inside this file).
 */
const STATUS_DOT: Record<TarefaStatus, string> = {
  proximo: "bg-apricot",
  "em-curso": "bg-ember",
  "aguarda-cliente": "bg-peach",
  "aguarda-pecas": "bg-peach",
  "aguarda-fornecedor": "bg-peach",
  pronto: "bg-emerald-500",
  fechado: "bg-ink-mute/60",
  cancelado: "bg-dune",
  garantia: "bg-cream-deep",
  suspenso: "bg-ink-mute/60",
  bloqueado: "bg-dune-deep",
};

export function MonthCalendar({ year, monthIndex, tarefas }: Props) {
  const totalDays = daysInMonth(year, monthIndex);
  const firstWeekday = firstWeekdayOfMonth(year, monthIndex);
  const totalCells = Math.ceil((firstWeekday + totalDays) / 7) * 7;

  // Build map of day -> tarefas
  const byDay = new Map<number, TarefaPublic[]>();
  for (const t of tarefas) {
    const d = parseIsoDate(t.prazo);
    if (!d) continue;
    if (d.getFullYear() !== year || d.getMonth() !== monthIndex) continue;
    const day = d.getDate();
    const list = byDay.get(day) ?? [];
    list.push(t);
    byDay.set(day, list);
  }

  const cells: Array<{ day: number | null; items: TarefaPublic[] }> = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - firstWeekday + 1;
    if (dayNum < 1 || dayNum > totalDays) {
      cells.push({ day: null, items: [] });
    } else {
      cells.push({ day: dayNum, items: byDay.get(dayNum) ?? [] });
    }
  }

  return (
    <div className="rounded-card border border-dune-deep/10 bg-sand-warm/70 overflow-hidden shadow-warm">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-dune-deep/10 bg-cream-deep">
        {DAYS_HEADER.map((d) => (
          <div
            key={d}
            className="px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 [&>*:nth-child(7n)]:border-r-0">
        {cells.map((cell, idx) => {
          if (cell.day === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[110px] border-b border-r border-dune-deep/8 bg-cream/30"
                aria-hidden="true"
              />
            );
          }
          const dateForDay = new Date(year, monthIndex, cell.day);
          const todayCell = isToday(dateForDay.toISOString());
          return (
            <div
              key={`day-${cell.day}`}
              className={cn(
                "min-h-[110px] border-b border-r border-dune-deep/8 p-2 flex flex-col gap-1",
                todayCell && "bg-apricot/10 ring-2 ring-inset ring-ember/40"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "font-mono text-xs font-semibold tabular-nums",
                    todayCell
                      ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-ember text-cream"
                      : "text-ink"
                  )}
                >
                  {cell.day}
                </span>
                {cell.items.length > 3 && (
                  <span className="font-mono text-[10px] text-ink-mute tabular-nums">
                    +{cell.items.length - 3}
                  </span>
                )}
              </div>
              <ul className="space-y-1">
                {cell.items.slice(0, 3).map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/painel/tarefas/${t.id}`}
                      className="block group"
                      title={`${t.titulo}${t.cliente ? ` — ${t.cliente}` : ""}`}
                    >
                      <span className="flex items-center gap-1.5 rounded-sm bg-white/70 hover:bg-white px-1.5 py-0.5 text-[11px] font-medium text-ink transition-colors">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full shrink-0",
                            STATUS_DOT[t.status]
                          )}
                          aria-hidden="true"
                        />
                        <span className="truncate">{t.titulo}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
