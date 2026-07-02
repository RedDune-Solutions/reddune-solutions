import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  daysInMonth,
  firstWeekdayOfMonth,
  isToday,
  parseIsoDate,
  todayLisbonDate,
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

// Map status → design .ev tone (painel.css): default(ember) | amber | green | ink
const STATUS_EV: Record<ProjetoStatus, string> = {
  "ideia-interna": "ink",
  "ideia-cliente": "ink",
  proximo: "",
  "em-curso": "",
  "aguardando-cliente": "amber",
  "aguardando-encomenda": "amber",
  terminado: "green",
  fechado: "green",
  cancelado: "ink",
};

export function MonthCalendar({ year, monthIndex, projetos, tarefas = [] }: Props) {
  // "Hoje" no fuso de Portugal (não no do servidor Vercel, que corre em UTC).
  const hojeLisboa = todayLisbonDate();
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
    <div className="cal">
      {DAYS_HEADER.map((d) => (
        <div key={`dow-${d}`} className="dow">
          {d}
        </div>
      ))}
      {cells.map((cell, idx) => {
        if (cell.day === null) {
          return <div key={`empty-${idx}`} className="dy faded" aria-hidden="true" />;
        }
        const dateForDay = new Date(year, monthIndex, cell.day);
        const todayCell = isToday(dateForDay.toISOString(), hojeLisboa);
        const visible = cell.entries.slice(0, 3);
        const overflow = cell.entries.length - visible.length;

        return (
          <div key={`day-${cell.day}`} className={cn("dy", todayCell && "today")}>
            <div className="row between">
              <span className="num">{cell.day}</span>
              {overflow > 0 && (
                <span className="mono muted" style={{ fontSize: 10 }}>+{overflow}</span>
              )}
            </div>
            {visible.map((entry, i) => {
              if (entry.kind === "projeto") {
                const p = entry.item;
                return (
                  <Link
                    key={`p-${p.id}-${i}`}
                    href={`/painel/projetos/${p.id}`}
                    className={cn("ev", STATUS_EV[p.status])}
                    title={`${p.titulo}${p.clienteNome ? ` — ${p.clienteNome}` : ""}`}
                  >
                    {p.titulo}
                  </Link>
                );
              }
              const t = entry.item;
              return (
                <Link
                  key={`t-${t.id}-${i}`}
                  href={`/painel/projetos/${t.projetoId}`}
                  className={cn("ev", t.feita && "green")}
                  title={`Tarefa: ${t.titulo}`}
                >
                  {t.prazoHora ? `${t.prazoHora} · ` : ""}{t.titulo}
                </Link>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
