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
import { monthKey, parseMonthKey, parseIsoDate, isToday, isWithinNextDays, todayLisbonDate } from "@/lib/dates";
import { STATUS_GROUPS, type Projeto } from "@/types/projeto";
import type { Tarefa } from "@/types/tarefa";

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

  // "Hoje" no fuso de Portugal (o servidor Vercel corre em UTC).
  const today = todayLisbonDate();
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
        crumbs={["Painel", "Calendário"]}
        title="Calendário"
        description="Projectos e tarefas com prazo agendado."
      />

      <div className="content">
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
          <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 18, alignItems: "start" }} className="cal-month-grid">
            <MonthCalendar
              year={target.year}
              monthIndex={target.monthIndex}
              projetos={projetos}
              tarefas={tarefas}
            />
            <AgendaSide projetos={projetos} tarefas={tarefas} />
          </div>
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

// `accionavel`: entrada em estado accionável (tarefa não-feita / projecto não
// fechado nem cancelado). O cartão "Hoje" da agenda mostra só accionáveis, para
// alinhar com o widget "Hoje" do dashboard (páginel/page.tsx), que só conta
// projectos activos. A grelha mensal (MonthCalendar) mantém tudo, de propósito,
// porque o color-coding de estados fechados aí é intencional.
type AgendaEntry = { id: string; href: string; label: string; sub: string | null; date: Date; accionavel: boolean };

function buildAgenda(projetos: Projeto[], tarefas: Tarefa[]) {
  // "Hoje" no fuso de Portugal (o servidor Vercel corre em UTC).
  const now = todayLisbonDate();
  const entries: AgendaEntry[] = [];
  for (const p of projetos) {
    const d = parseIsoDate(p.prazo ?? null);
    if (!d) continue;
    const accionavel = !STATUS_GROUPS.arquivo.includes(p.status);
    entries.push({ id: `p-${p.id}`, href: `/painel/projetos/${p.id}`, label: p.titulo, sub: p.clienteNome ?? null, date: d, accionavel });
  }
  for (const t of tarefas) {
    const d = parseIsoDate(t.prazo ?? null);
    if (!d) continue;
    entries.push({ id: `t-${t.id}`, href: `/painel/projetos/${t.projetoId}`, label: t.titulo, sub: "Tarefa", date: d, accionavel: !t.feita });
  }
  const hoje = entries
    .filter((e) => e.accionavel && isToday(e.date.toISOString(), now))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const proximos = entries
    .filter((e) => e.accionavel && !isToday(e.date.toISOString(), now) && isWithinNextDays(e.date.toISOString(), 7, now))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 8);
  return { hoje, proximos };
}

function AgendaSide({ projetos, tarefas }: { projetos: Projeto[]; tarefas: Tarefa[] }) {
  const { hoje, proximos } = buildAgenda(projetos, tarefas);
  const fmtDay = (d: Date) =>
    d.toLocaleDateString("pt-PT", { weekday: "short", day: "2-digit", month: "short" });

  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="card">
        <div className="ch">
          <div>
            <div className="t">Hoje</div>
            <div className="sub">{todayLisbonDate().toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long" })}</div>
          </div>
        </div>
        <div className="cb">
          {hoje.length === 0 ? (
            <p className="muted" style={{ fontSize: 12.5 }}>Nada agendado hoje.</p>
          ) : (
            hoje.map((e, i) => (
              <a
                key={e.id}
                href={e.href}
                style={{ display: "block", padding: "10px 0", borderBottom: i < hoje.length - 1 ? "1px dashed rgba(90, 14, 14, 0.10)" : "0" }}
              >
                <div style={{ color: "var(--ink)", fontWeight: 500, fontSize: 13 }}>{e.label}</div>
                {e.sub && <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{e.sub}</div>}
              </a>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <div className="ch"><div className="t">Próximos · esta semana</div></div>
        <div className="cb">
          {proximos.length === 0 ? (
            <p className="muted" style={{ fontSize: 12.5 }}>Sem prazos nos próximos 7 dias.</p>
          ) : (
            proximos.map((e, i) => (
              <a
                key={e.id}
                href={e.href}
                style={{ display: "block", padding: "10px 0", borderBottom: i < proximos.length - 1 ? "1px dashed rgba(90, 14, 14, 0.10)" : "0" }}
              >
                <div className="mono muted" style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 3 }}>{fmtDay(e.date)}</div>
                <div style={{ color: "var(--ink)", fontWeight: 500, fontSize: 13 }}>{e.label}</div>
                {e.sub && <div className="muted" style={{ fontSize: 11.5, marginTop: 1 }}>{e.sub}</div>}
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
