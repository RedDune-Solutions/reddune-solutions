import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  daysInMonth,
  firstWeekdayOfMonth,
  isToday,
  parseIsoDate,
} from "@/lib/dates";
import type { Projeto, ProjetoStatus } from "@/types/projeto";
import type { Tarefa } from "@/types/tarefa";

type CalendarEntry =
  | { kind: "projeto"; item: Projeto }
  | { kind: "tarefa"; item: Tarefa };

type Props = {
  year: number;
  monthIndex: number;
  projetos: Projeto[];
  tarefas?: Tarefa[];
};

const DAYS_HEADER = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const STATUS_DOT: Record<ProjetoStatus, string> = {
  proximo: "bg-apricot",
  "em-curso": "bg-ember",
  aguardando: "bg-amber-400",
  terminado: "bg-amber-500",
  fechado: "bg-emerald-600",
  cancelado: "bg-ink-mute/60",
};

export function MonthCalendar({ year, monthIndex, projetos, tarefas = [] }: Props) {
  const totalDays = daysInMonth(year, monthIndex);
  const firstWeekday = firstWeekdayOfMonth(year, monthIndex);
  const totalCells = Math.ceil((firstWeekday + totalDays) / 7) * 7;

  const byDay = new Map<number, CalendarEntry[]>();

  function addToDay(day: number, entry: CalendarEntry) {
    const list = byDay.get(day) ?? [];
    list.push(entry);
    byDay.set(day, list);
  }

  for (const p of projetos) {
    const d = parseIsoDate(p.prazo);
    if (!d) continue;
    if (d.getFullYear() !== year || d.getMonth() !== monthIndex) continue;
    addToDay(d.getDate(), { kind: "projeto", item: p });
  }

  for (const t of tarefas) {
    if (!t.prazo) continue;
    const d = parseIsoDate(t.prazo);
    if (!d) continue;
    if (d.getFullYear() !== year || d.getMonth() !== monthIndex) continue;
    addToDay(d.getDate(), { kind: "tarefa", item: t });
  }

  const cells: Array<{ day: number | null; entries: CalendarEntry[] }> = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - firstWeekday + 1;
    if (dayNum < 1 || dayNum > totalDays) {
      cells.push({ day: null, entries: [] });
    } else {
      cells.push({ day: dayNum, entries: byDay.get(dayNum) ?? [] });
    }
  }

  return (
    <div className="rounded-card border border-dune-deep/10 bg-sand-warm/70 overflow-hidden shadow-warm">
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
          const visible = cell.entries.slice(0, 3);
          const overflow = cell.entries.length - visible.length;

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
                {overflow > 0 && (
                  <span className="font-mono text-[10px] text-ink-mute tabular-nums">
                    +{overflow}
                  </span>
                )}
              </div>
              <ul className="space-y-1">
                {visible.map((entry, i) => {
                  if (entry.kind === "projeto") {
                    const p = entry.item;
                    return (
                      <li key={`p-${p.id}-${i}`}>
                        <Link
                          href={`/painel/projetos/${p.id}`}
                          className="block group"
                          title={`${p.titulo}${p.clienteNome ? ` — ${p.clienteNome}` : ""}`}
                        >
                          <span className="flex items-center gap-1.5 rounded-sm bg-white/70 hover:bg-white px-1.5 py-0.5 text-[11px] font-medium text-ink transition-colors">
                            <span
                              className={cn("h-1.5 w-1.5 rounded-full shrink-0", STATUS_DOT[p.status])}
                              aria-hidden="true"
                            />
                            <span className="truncate">{p.titulo}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  } else {
                    const t = entry.item;
                    return (
                      <li key={`t-${t.id}-${i}`}>
                        <Link
                          href={`/painel/projetos/${t.projetoId}`}
                          className="block group"
                          title={`Tarefa: ${t.titulo}`}
                        >
                          <span className="flex items-center gap-1.5 rounded-sm bg-white/50 hover:bg-white/80 px-1.5 py-0.5 text-[11px] text-ink-soft transition-colors">
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full shrink-0 border border-ink-mute/40",
                                t.feita ? "bg-emerald-400" : "bg-white"
                              )}
                              aria-hidden="true"
                            />
                            <span className="truncate italic">{t.titulo}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  }
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
