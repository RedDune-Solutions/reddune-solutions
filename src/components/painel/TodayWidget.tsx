import Link from "next/link";
import { AlertCircle, CalendarClock, Clock, ArrowRight, type LucideIcon } from "lucide-react";
import { TarefaCard } from "./TarefaCard";
import {
  isOverdue,
  isToday,
  isWithinNextDays,
  parseIsoDate,
} from "@/lib/dates";
import { STATUS_GROUPS, type Projeto } from "@/types/projeto";

type Props = {
  projetos: Projeto[];
};

export function TodayWidget({ projetos }: Props) {
  const now = new Date();

  const active = projetos.filter(
    (p) =>
      STATUS_GROUPS.ativo.includes(p.status) ||
      STATUS_GROUPS.proximo.includes(p.status) ||
      STATUS_GROUPS.aguarda.includes(p.status)
  );

  const overdue = active
    .filter((p) => p.prazo && isOverdue(p.prazo, now))
    .sort((a, b) => {
      const aDate = parseIsoDate(a.prazo ?? null);
      const bDate = parseIsoDate(b.prazo ?? null);
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return aDate.getTime() - bDate.getTime();
    });
  const today = active.filter((p) => isToday(p.prazo, now));
  const upcoming = active.filter((p) => isWithinNextDays(p.prazo, 7, now));

  if (overdue.length === 0 && today.length === 0 && upcoming.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Atenção hoje"
      className="rounded-card border border-ember/25 bg-apricot/10 p-6 md:p-8 shadow-warm"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ember">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            Atenção
          </p>
          <h2 className="mt-2 font-display text-xl md:text-2xl font-semibold leading-tight tracking-tight text-ink">
            {overdue.length > 0 || today.length > 0
              ? "Projetos a tratar agora"
              : "Próximos prazos"}
          </h2>
        </div>
        <Link
          href="/painel/calendario"
          className="inline-flex items-center gap-1 text-xs font-medium text-ember hover:underline underline-offset-4"
        >
          Ver calendário
          <ArrowRight className="size-3 shrink-0" strokeWidth={2.25} aria-hidden />
        </Link>
      </div>

      <div className="mt-6 space-y-6">
        {overdue.length > 0 && (
          <Group
            label="Atrasados"
            count={overdue.length}
            icon={AlertCircle}
            tone="destructive"
            items={overdue.slice(0, 4)}
          />
        )}
        {today.length > 0 && (
          <Group
            label="Hoje"
            count={today.length}
            icon={Clock}
            tone="accent"
            items={today.slice(0, 4)}
          />
        )}
        {upcoming.length > 0 && overdue.length + today.length < 4 && (
          <Group
            label="Próximos 7 dias"
            count={upcoming.length}
            icon={CalendarClock}
            tone="muted"
            items={upcoming.slice(0, 4)}
          />
        )}
      </div>
    </section>
  );
}

function Group({
  label,
  count,
  icon: Icon,
  tone,
  items,
}: {
  label: string;
  count: number;
  icon: LucideIcon;
  tone: "destructive" | "accent" | "muted";
  items: Projeto[];
}) {
  const toneClasses = {
    destructive: "text-dune",
    accent: "text-ember",
    muted: "text-ink-mute",
  }[tone];
  return (
    <div>
      <div
        className={`inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] ${toneClasses}`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
        <span className="tabular-nums text-ink-mute">·</span>
        <span className="tabular-nums text-ink-mute">{count}</span>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((projeto) => (
          <TarefaCard key={projeto.id} projeto={projeto} />
        ))}
      </div>
    </div>
  );
}
