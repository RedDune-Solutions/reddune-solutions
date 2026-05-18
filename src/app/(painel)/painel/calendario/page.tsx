import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAllProjetos } from "@/lib/mongodb/projetos";
import { getAllTarefas } from "@/lib/mongodb/tarefas";
import { Topbar } from "@/components/painel/Topbar";
import { MonthCalendar } from "@/components/painel/MonthCalendar";
import { WeekCalendar } from "@/components/painel/WeekCalendar";
import { DayCalendar } from "@/components/painel/DayCalendar";
import { CalendarViewToggle } from "@/components/painel/CalendarViewToggle";
import { Button } from "@/components/ui/button";
import { monthKey, parseMonthKey } from "@/lib/dates";

export const dynamic = "force-dynamic";

type View = "mes" | "semana" | "dia";
type SearchParams = Promise<{ m?: string; view?: string; date?: string }>;

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function parseDate(s: string | undefined): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const out = new Date(d);
  out.setDate(d.getDate() + diff);
  out.setHours(0, 0, 0, 0);
  return out;
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [projetos, tarefas, params] = await Promise.all([
    getAllProjetos(),
    getAllTarefas(),
    searchParams,
  ]);

  const view: View =
    params.view === "semana" || params.view === "dia" ? params.view : "mes";

  const today = new Date();
  const requested = params.m ? parseMonthKey(params.m) : null;
  const target = requested ?? { year: today.getFullYear(), monthIndex: today.getMonth() };
  const focusDate = parseDate(params.date) ?? today;

  const prev = new Date(target.year, target.monthIndex - 1, 1);
  const next = new Date(target.year, target.monthIndex + 1, 1);

  const weekStart = startOfWeek(focusDate);
  const weekPrev = new Date(weekStart);
  weekPrev.setDate(weekStart.getDate() - 7);
  const weekNext = new Date(weekStart);
  weekNext.setDate(weekStart.getDate() + 7);

  const dayPrev = new Date(focusDate);
  dayPrev.setDate(focusDate.getDate() - 1);
  const dayNext = new Date(focusDate);
  dayNext.setDate(focusDate.getDate() + 1);

  let title = "";
  let prevHref = "";
  let nextHref = "";
  let todayHref = "";
  if (view === "mes") {
    title = `${MONTH_NAMES[target.monthIndex]} ${target.year}`;
    prevHref = `/painel/calendario?view=mes&m=${monthKey(prev)}`;
    nextHref = `/painel/calendario?view=mes&m=${monthKey(next)}`;
    todayHref = `/painel/calendario?view=mes&m=${monthKey(today)}`;
  } else if (view === "semana") {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    title = `${weekStart.getDate()} ${MONTH_NAMES[weekStart.getMonth()]} – ${weekEnd.getDate()} ${MONTH_NAMES[weekEnd.getMonth()]}`;
    prevHref = `/painel/calendario?view=semana&date=${isoDate(weekPrev)}`;
    nextHref = `/painel/calendario?view=semana&date=${isoDate(weekNext)}`;
    todayHref = `/painel/calendario?view=semana&date=${isoDate(today)}`;
  } else {
    title = `${focusDate.getDate()} ${MONTH_NAMES[focusDate.getMonth()]} ${focusDate.getFullYear()}`;
    prevHref = `/painel/calendario?view=dia&date=${isoDate(dayPrev)}`;
    nextHref = `/painel/calendario?view=dia&date=${isoDate(dayNext)}`;
    todayHref = `/painel/calendario?view=dia&date=${isoDate(today)}`;
  }

  return (
    <>
      <Topbar
        title="Calendário"
        description="Projectos e tarefas com prazo agendado."
      />

      <div className="px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="h-9 bg-surface">
              <Link href={prevHref}>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <h2 className="font-headline text-xl md:text-2xl font-semibold tracking-tight">
              {title}
            </h2>
            <Button asChild variant="outline" size="sm" className="h-9 bg-surface">
              <Link href={nextHref}>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <CalendarViewToggle current={view} />
            <Button asChild variant="ghost" size="sm">
              <Link href={todayHref}>Hoje</Link>
            </Button>
          </div>
        </div>

        {view === "mes" && (
          <MonthCalendar
            year={target.year}
            monthIndex={target.monthIndex}
            projetos={projetos}
            tarefas={tarefas}
          />
        )}
        {view === "semana" && (
          <WeekCalendar projetos={projetos} tarefas={tarefas} weekStart={weekStart} />
        )}
        {view === "dia" && (
          <DayCalendar projetos={projetos} tarefas={tarefas} day={focusDate} />
        )}
      </div>
    </>
  );
}
