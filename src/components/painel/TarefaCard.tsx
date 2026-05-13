import Link from "next/link";
import { cn } from "@/lib/utils";
import { CalendarDays, User, ArrowUpRight, ArrowRight } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { TarefaPublic } from "@/types/tarefa";

type Props = {
  tarefa: TarefaPublic;
  className?: string;
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function TarefaCard({ tarefa, className }: Props) {
  const prazo = formatDate(tarefa.prazo);

  return (
    <Link
      href={`/painel/tarefas/${tarefa.id}`}
      className={cn(
        "group relative block overflow-hidden rounded-card border border-dune-deep/10 bg-white/70 p-5 shadow-warm",
        "transition-all duration-300 hover:border-ember/30 hover:-translate-y-0.5 hover:shadow-warm-lg",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <StatusBadge status={tarefa.status} />
        <ArrowUpRight
          className="h-4 w-4 text-ink-mute transition-all duration-300 group-hover:text-ember group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden="true"
        />
      </div>

      <h3 className="mt-3 font-display text-lg font-semibold leading-tight tracking-tight line-clamp-2 text-ink">
        {tarefa.titulo}
      </h3>

      {tarefa.proximaAccao && (
        <p className="mt-2 text-sm text-ink-soft leading-relaxed">
          <span className="inline-flex max-w-full items-start gap-1.5">
            <ArrowRight
              className="size-3.5 shrink-0 mt-0.5 text-ink-mute"
              strokeWidth={2.25}
              aria-hidden
            />
            <span className="min-w-0 line-clamp-2">{tarefa.proximaAccao}</span>
          </span>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-mute">
        {tarefa.cliente && (
          <span className="inline-flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="truncate max-w-[160px]">{tarefa.cliente}</span>
          </span>
        )}
        {prazo && (
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {prazo}
          </span>
        )}
        {tarefa.tipo && (
          <span className="inline-flex items-center gap-1.5 font-mono uppercase tracking-tight">
            #{tarefa.tipo.replace("-", " ")}
          </span>
        )}
      </div>
    </Link>
  );
}
