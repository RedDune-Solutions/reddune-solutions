"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tarefa } from "@/types/tarefa";
import type { Projeto, ProjetoStatus } from "@/types/projeto";
import { safeJsonPost, safeDelete } from "@/lib/safe-fetch";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";

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
  aguardando: 2,
  terminado: 3,
  fechado: 4,
  "ideia-interna": 5,
  "ideia-cliente": 5,
};

const WEEKDAYS_PT = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

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

// Prazo relativo à la protótipo: "hoje · 14:00" / "amanhã" / "quinta" / "12 jul" / "feito"
function formatPrazoRel(t: Tarefa): string {
  if (t.feita) return "feito";
  if (!t.prazo) return "";
  const prazo = startOfDay(new Date(t.prazo));
  const today = startOfDay(new Date());
  const diff = Math.round((prazo.getTime() - today.getTime()) / 86400000);
  const hora = t.prazoHora ? ` · ${t.prazoHora}` : "";
  if (diff === 0) return `hoje${hora}`;
  if (diff === 1) return `amanhã${hora}`;
  if (diff > 1 && diff < 7) return `${WEEKDAYS_PT[prazo.getDay()]}${hora}`;
  try {
    return `${new Date(t.prazo).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}${hora}`;
  } catch {
    return t.prazo;
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
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  // Estado local optimista — reconciliado com as props quando o
  // router.refresh() traz dados novos do servidor.
  const [items, setItems] = useState<Tarefa[]>(tarefas);

  useEffect(() => {
    setItems(tarefas);
  }, [tarefas]);

  // Filter tarefas by feita state + active filter
  const filtered = items.filter((t) => {
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
    const novoFeita = !t.feita;
    // Optimista: flipa já localmente.
    setItems((prev) => prev.map((x) => (x.id === t.id ? { ...x, feita: novoFeita } : x)));
    setBusy(t.id);
    const res = await safeJsonPost("/api/tarefas/edit", {
      tarefaId: t.id,
      patch: { feita: novoFeita },
    });
    setBusy(null);
    if (!res.ok) {
      // Revert.
      setItems((prev) => prev.map((x) => (x.id === t.id ? { ...x, feita: t.feita } : x)));
      toast({ title: "Erro a actualizar tarefa", description: res.error, variant: "destructive" });
      return;
    }
    startTransition(() => router.refresh());
  }

  async function deleteTarefa(id: string) {
    const ok = await confirm({
      title: "Apagar tarefa?",
      description: "Esta acção remove a tarefa. Não pode ser desfeita.",
      confirmLabel: "Apagar",
      tone: "destructive",
    });
    if (!ok) return;
    // Optimista: remove já localmente, guardando para repor em caso de erro.
    const removida = items.find((t) => t.id === id);
    setItems((prev) => prev.filter((t) => t.id !== id));
    setBusy(id);
    const res = await safeDelete(`/api/tarefas/${encodeURIComponent(id)}`);
    setBusy(null);
    if (!res.ok) {
      // Revert: repõe a tarefa.
      if (removida) setItems((prev) => (prev.some((t) => t.id === id) ? prev : [...prev, removida]));
      toast({ title: "Erro a apagar tarefa", description: res.error, variant: "destructive" });
      return;
    }
    startTransition(() => router.refresh());
  }

  if (groups.length === 0) {
    return (
      <div className="empty">
        <div className="ic" style={{ marginBottom: 6 }}>
          <AlertCircle style={{ width: 20, height: 20, display: "inline-block" }} aria-hidden="true" />
        </div>
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
    <div>
      {groups.map(({ projeto, tarefas: ts }) => {
        const sorted = sortTarefas(ts);

        return (
          <div key={projeto.id} className="task-group">
            <h3>
              {projeto.titulo}
              {projeto.clienteNome ? ` — ${projeto.clienteNome}` : ""}
              <Link href={`/painel/projetos/${projeto.id}`}>ver projeto →</Link>
            </h3>
            {sorted.map((t) => {
              const ps = prazoStatus(t.prazo);
              const isBusy = busy === t.id || pending;
              const time = formatPrazoRel(t);
              return (
                <div key={t.id} className={cn("trow group/item", t.feita && "done")}>
                  <button
                    type="button"
                    onClick={() => toggleFeita(t)}
                    disabled={isBusy}
                    aria-label={t.feita ? "Marcar por fazer" : "Marcar feita"}
                    className="check"
                  >
                    {t.feita && <Check aria-hidden="true" />}
                  </button>
                  <span className="t-title">{t.titulo}</span>
                  {time && (
                    <span
                      className="t-time"
                      style={!t.feita && ps === "vencida" ? { color: "var(--ember)" } : undefined}
                    >
                      {time}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteTarefa(t.id)}
                    disabled={isBusy}
                    aria-label="Apagar tarefa"
                    className="icon-mini opacity-100 lg:opacity-0 lg:group-hover/item:opacity-100 focus-visible:opacity-100 transition-opacity"
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
