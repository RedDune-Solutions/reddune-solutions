import Link from "next/link";
import { AlertCircle, CalendarClock, Clock, type LucideIcon } from "lucide-react";
import { TarefaCard } from "./TarefaCard";
import {
  isOverdue,
  isToday,
  isWithinNextDays,
} from "@/lib/dates";
import { STATUS_GROUPS, type TarefaPublic } from "@/types/tarefa";

type Props = {
  tarefas: TarefaPublic[];
};

export function TodayWidget({ tarefas }: Props) {
  const now = new Date();

  const active = tarefas.filter(
    (t) =>
      STATUS_GROUPS.ativo.includes(t.status) ||
      STATUS_GROUPS.proximo.includes(t.status) ||
      STATUS_GROUPS.aguarda.includes(t.status)
  );

  const overdue = active
    .filter((t) => t.prazo && isOverdue(t.prazo, now))
    .sort((a, b) => (a.prazo ?? "").localeCompare(b.prazo ?? ""));
  const today = active.filter((t) => isToday(t.prazo, now));
  const upcoming = active.filter((t) => isWithinNextDays(t.prazo, 7, now));

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
              ? "Tarefas a tratar agora"
              : "Próximos prazos"}
          </h2>
        </div>
        <Link
          href="/painel/calendario"
          className="text-xs font-medium text-ember hover:underline underline-offset-4"
        >
          Ver calendário →
        </Link>
      </div>

      <div className="mt-6 space-y-6">
        {overdue.length > 0 && (
          <Group
            label="Atrasadas"
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
  items: TarefaPublic[];
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
        {items.map((tarefa) => (
          <TarefaCard key={tarefa.id} tarefa={tarefa} />
        ))}
      </div>
    </div>
  );
}
