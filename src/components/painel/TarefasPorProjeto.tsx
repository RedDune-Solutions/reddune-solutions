"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Trash2, ArrowRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import type { Tarefa } from "@/types/tarefa";
import type { Projeto, ProjetoStatus } from "@/types/projeto";

type TarefaFilter = "todas" | "hoje" | "semana" | "vencidas";

type Props = {
  tarefas: Tarefa[];
  projetos: Projeto[];
  filter: TarefaFilter;
  showFeitas: boolean;
};

// Status priority for ordering projects (lower = more urgent)
const STATUS_PRIORITY: Record<ProjetoStatus, number> = {
  "em-curso": 0,
  proximo: 1,
  "aguardando-cliente": 2,
  "aguardando-encomenda": 2,
  terminado: 3,
  fechado: 4,
  cancelado: 5,
  "ideia-interna": 5,
  "ideia-cliente": 5,
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function applyTarefaFilter(t: Tarefa, filter: TarefaFilter): boolean {
  if (filter === "todas") return true;
  if (!t.prazo) return false;
  const prazo = startOfDay(new Date(t.prazo));
  const today = startOfDay(new Date());
  if (filter === "hoje") return prazo.getTime() === today.getTime();
  if (filter === "vencidas") return prazo < today;
  if (filter === "semana") {
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return prazo >= today && prazo <= weekEnd;
  }
  return true;
}

function formatPrazo(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return iso;
  }
}

function prazoStatus(iso: string | null): "vencida" | "hoje" | "futura" | null {
  if (!iso) return null;
  const prazo = startOfDay(new Date(iso));
  const today = startOfDay(new Date());
  if (prazo < today) return "vencida";
  if (prazo.getTime() === today.getTime()) return "hoje";
  return "futura";
}

export function TarefasPorProjeto({ tarefas, projetos, filter, showFeitas }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  // Filter tarefas by feita state + active filter
  const filtered = tarefas.filter((t) => {
    if (!showFeitas && t.feita) return false;
    return applyTarefaFilter(t, filter);
  });

  // Group by projetoId
  const projetoMap = new Map(projetos.map((p) => [p.id, p]));
  const grouped = new Map<string, Tarefa[]>();
  for (const t of filtered) {
    const list = grouped.get(t.projetoId) ?? [];
    list.push(t);
    grouped.set(t.projetoId, list);
  }

  // Sort groups by project status priority
  const groups = Array.from(grouped.entries())
    .map(([projetoId, ts]) => ({
      projeto: projetoMap.get(projetoId),
      tarefas: ts,
    }))
    .filter((g): g is { projeto: Projeto; tarefas: Tarefa[] } => !!g.projeto)
    .sort((a, b) => {
      const pa = STATUS_PRIORITY[a.projeto.status] ?? 99;
      const pb = STATUS_PRIORITY[b.projeto.status] ?? 99;
      if (pa !== pb) return pa - pb;
      return a.projeto.titulo.localeCompare(b.projeto.titulo);
    });

  async function toggleFeita(t: Tarefa) {
    setBusy(t.id);
    try {
      await fetch("/api/tarefas/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tarefaId: t.id, patch: { feita: !t.feita } }),
      });
      startTransition(() => router.refresh());
    } finally {
      setBusy(null);
    }
  }

  async function deleteTarefa(id: string) {
    setBusy(id);
    try {
      await fetch(`/api/tarefas/${encodeURIComponent(id)}`, { method: "DELETE" });
      startTransition(() => router.refresh());
    } finally {
      setBusy(null);
    }
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-3" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          {filter === "todas"
            ? "Sem tarefas pendentes. Tudo em dia."
            : `Sem tarefas para o filtro "${filter}".`}
        </p>
      </div>
    );
  }

  // Sort tarefas inside each group: vencidas first, then hoje, then by prazo, then sem prazo
  function sortTarefas(arr: Tarefa[]): Tarefa[] {
    return [...arr].sort((a, b) => {
      const sa = prazoStatus(a.prazo);
      const sb = prazoStatus(b.prazo);
      const rank = (s: typeof sa) => (s === "vencida" ? 0 : s === "hoje" ? 1 : s === "futura" ? 2 : 3);
      const ra = rank(sa);
      const rb = rank(sb);
      if (ra !== rb) return ra - rb;
      if (a.prazo && b.prazo) return new Date(a.prazo).getTime() - new Date(b.prazo).getTime();
      return a.ordem - b.ordem;
    });
  }

  return (
    <div className="space-y-4">
      {groups.map(({ projeto, tarefas: ts }) => {
        const sorted = sortTarefas(ts);
        const pendentesCount = ts.filter((t) => !t.feita).length;

        return (
          <details
            key={projeto.id}
            open
            className="group rounded-xl border border-border bg-card overflow-hidden"
          >
            <summary className="cursor-pointer list-none flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors">
              <ChevronRight
                className="h-4 w-4 text-muted-foreground group-open:rotate-90 transition-transform"
                aria-hidden="true"
              />
              <Link
                href={`/painel/projetos/${projeto.id}`}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-foreground hover:text-primary transition-colors"
              >
                {projeto.titulo}
              </Link>
              {projeto.clienteNome && (
                <span className="text-xs text-muted-foreground hidden md:inline">
                  · {projeto.clienteNome}
                </span>
              )}
              <span className="ml-auto flex items-center gap-2">
                <StatusBadge status={projeto.status} />
                <span className="font-mono text-xs tabular-nums text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {pendentesCount}/{ts.length}
                </span>
              </span>
            </summary>

            <ul className="divide-y divide-border/60">
              {sorted.map((t) => {
                const ps = prazoStatus(t.prazo);
                const isBusy = busy === t.id || pending;
                return (
                  <li
                    key={t.id}
                    className="group/item flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={t.feita}
                      onChange={() => toggleFeita(t)}
                      disabled={isBusy}
                      id={`t-${t.id}`}
                      className="h-4 w-4 rounded border-border accent-primary shrink-0"
                    />
                    <label
                      htmlFor={`t-${t.id}`}
                      className={cn(
                        "flex-1 text-sm cursor-pointer min-w-0",
                        t.feita && "line-through text-muted-foreground"
                      )}
                    >
                      {t.titulo}
                    </label>
                    {t.prazo && (
                      <span
                        className={cn(
                          "shrink-0 inline-flex items-center gap-1 text-xs font-mono tabular-nums px-2 py-0.5 rounded",
                          ps === "vencida" && "bg-rose-500/10 text-rose-600 font-semibold",
                          ps === "hoje" && "bg-amber-500/10 text-amber-700 font-semibold",
                          ps === "futura" && "text-muted-foreground"
                        )}
                      >
                        {ps === "vencida" && <ArrowRight className="h-3 w-3" aria-hidden="true" />}
                        {formatPrazo(t.prazo)}
                      </span>
                    )}
                    <button
                      onClick={() => deleteTarefa(t.id)}
                      disabled={isBusy}
                      aria-label="Apagar tarefa"
                      className="opacity-0 group-hover/item:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
