"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Trash2, ArrowRight, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import type { Tarefa } from "@/types/tarefa";
import type { Projeto, ProjetoStatus } from "@/types/projeto";
import { safeJsonPost, safeDelete } from "@/lib/safe-fetch";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
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
    const res = await safeJsonPost("/api/tarefas/edit", {
      tarefaId: t.id,
      patch: { feita: !t.feita },
    });
    setBusy(null);
    if (!res.ok) {
      toast({ title: "Erro a actualizar tarefa", description: res.error, variant: "destructive" });
      return;
    }
    startTransition(() => router.refresh());
  }

  async function deleteTarefa(id: string) {
    setBusy(id);
    const res = await safeDelete(`/api/tarefas/${encodeURIComponent(id)}`);
    setBusy(null);
    if (!res.ok) {
      toast({ title: "Erro a apagar tarefa", description: res.error, variant: "destructive" });
      return;
    }
    startTransition(() => router.refresh());
  }

  if (groups.length === 0) {
    return (
      <div className="empty">
        <div className="ic"><AlertCircle aria-hidden="true" /></div>
        <div className="t">
          {filter === "todas" ? "Tudo em dia" : "Sem tarefas"}
        </div>
        <div className="desc">
          {filter === "todas"
            ? "Sem tarefas pendentes."
            : `Sem tarefas para o filtro "${filter}".`}
        </div>
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
    <div className="col" style={{ gap: 16 }}>
      {groups.map(({ projeto, tarefas: ts }) => {
        const sorted = sortTarefas(ts);
        const pendentesCount = ts.filter((t) => !t.feita).length;

        return (
          <details key={projeto.id} open className="group card flat" style={{ overflow: "hidden" }}>
            <summary className="ch cursor-pointer list-none" style={{ gap: 12 }}>
              <div className="row" style={{ gap: 10, minWidth: 0 }}>
                <ChevronRight
                  className="h-4 w-4 text-ink-mute group-open:rotate-90 transition-transform shrink-0"
                  aria-hidden="true"
                />
                <Link
                  href={`/painel/projetos/${projeto.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="t"
                  style={{ textDecoration: "none" }}
                >
                  {projeto.titulo}
                </Link>
                {projeto.clienteNome && (
                  <span className="muted hidden md:inline" style={{ fontSize: 12 }}>
                    · {projeto.clienteNome}
                  </span>
                )}
              </div>
              <span className="row" style={{ gap: 8 }}>
                <StatusBadge status={projeto.status} />
                <span className="mono muted" style={{ fontSize: 11 }}>
                  {pendentesCount}/{ts.length}
                </span>
              </span>
            </summary>

            <div className="cb checklist">
              {sorted.map((t) => {
                const ps = prazoStatus(t.prazo);
                const isBusy = busy === t.id || pending;
                return (
                  <div key={t.id} className={cn("item group/item", t.feita && "done")}>
                    <button
                      type="button"
                      onClick={() => toggleFeita(t)}
                      disabled={isBusy}
                      aria-label={t.feita ? "Marcar por fazer" : "Marcar feita"}
                      className="box"
                    >
                      {t.feita && <Check className="h-2.5 w-2.5" style={{ color: "#faf4e3" }} aria-hidden="true" />}
                    </button>
                    <span className="lbl" style={{ flex: 1, minWidth: 0 }}>{t.titulo}</span>
                    {t.prazo && (
                      <span
                        className={cn(
                          "due",
                          ps === "vencida" && "ember",
                          ps === "hoje" && "ember"
                        )}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        {ps === "vencida" && <ArrowRight className="h-3 w-3" aria-hidden="true" />}
                        {formatPrazo(t.prazo)}
                      </span>
                    )}
                    <button
                      onClick={() => deleteTarefa(t.id)}
                      disabled={isBusy}
                      aria-label="Apagar tarefa"
                      className="opacity-0 group-hover/item:opacity-100 transition-opacity text-ink-mute hover:text-destructive p-1 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}
