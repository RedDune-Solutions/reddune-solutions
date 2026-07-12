"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { parseIsoDate, startOfDay } from "@/lib/dates";
import type { Projeto, ProjetoStatus } from "@/types/projeto";
import type { Tarefa } from "@/types/tarefa";
import { QuickTarefaModal } from "./QuickTarefaModal";

type Props = {
  projetos: Projeto[];
  tarefas: Tarefa[];
  weekStart: Date;
};

const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const HOUR_START = 8;
const HOUR_END = 20;

const STATUS_DOT: Record<ProjetoStatus, string> = {
  "ideia-interna": "bg-violet-400",
  "ideia-cliente": "bg-amber-400",
  proximo: "bg-apricot",
  "em-curso": "bg-ember",
  "aguardando-cliente": "bg-amber-300",
  "aguardando-encomenda": "bg-amber-400",
  terminado: "bg-amber-500",
  fechado: "bg-emerald-600",
  cancelado: "bg-ink-mute/60",
};

function isoFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function WeekCalendar({ projetos, tarefas, weekStart }: Props) {
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickPrazo, setQuickPrazo] = useState<string | null>(null);
  const [quickHora, setQuickHora] = useState<string | null>(null);

  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [weekStart]);

  const hours: number[] = [];
  for (let h = HOUR_START; h < HOUR_END; h++) hours.push(h);

  function tarefasFor(day: Date) {
    return tarefas.filter((t) => {
      const d = parseIsoDate(t.prazo);
      return d && sameDay(d, day);
    });
  }

  function projetosFor(day: Date) {
    return projetos.filter((p) => {
      const d = parseIsoDate(p.prazo);
      return d && sameDay(d, day);
    });
  }

  function openQuick(day: Date, hour: number) {
    setQuickPrazo(isoFromDate(day));
    setQuickHora(`${String(hour).padStart(2, "0")}:00`);
    setQuickOpen(true);
  }

  const today = new Date();

  return (
    <>
      <div className="cal" style={{ padding: 0, overflow: "hidden" }}>
        {/* Header */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-dune-deep/10 bg-cream-deep">
          <div className="px-2 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-ink-mute">
            Hora
          </div>
          {days.map((d, i) => {
            const isToday = sameDay(d, today);
            return (
              <div
                key={i}
                className={cn(
                  "px-2 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft border-l border-dune-deep/10",
                  isToday && "text-ember"
                )}
              >
                {DAY_NAMES[i]} {d.getDate()}
              </div>
            );
          })}
        </div>

        {/* All-day strip */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-dune-deep/10 bg-cream/40">
          <div className="px-2 py-1 text-[10px] font-mono text-ink-mute">Dia inteiro</div>
          {days.map((d, i) => {
            const ps = projetosFor(d);
            const tsNoHora = tarefasFor(d).filter((t) => !t.prazoHora);
            return (
              <div key={i} className="border-l border-dune-deep/10 p-1 min-h-[36px]">
                {ps.map((p) => (
                  <Link
                    key={`p-${p.id}`}
                    href={`/painel/projetos/${p.id}`}
                    className="cal-ev"
                    title={p.titulo}
                  >
                    <span className={cn("inline-block h-1.5 w-1.5 rounded-full mr-1", STATUS_DOT[p.status])} />
                    {p.titulo}
                  </Link>
                ))}
                {tsNoHora.map((t) => (
                  <Link
                    key={`t-${t.id}`}
                    href={`/painel/projetos/${t.projetoId}`}
                    className="cal-ev b"
                    title={t.titulo}
                  >
                    {t.titulo}
                  </Link>
                ))}
              </div>
            );
          })}
        </div>

        {/* Hour rows */}
        <div>
          {hours.map((h) => (
            <div
              key={h}
              className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-dune-deep/8"
            >
              <div className="px-2 py-1 text-[10px] font-mono text-ink-mute tabular-nums">
                {String(h).padStart(2, "0")}:00
              </div>
              {days.map((d, di) => {
                const slotTarefas = tarefasFor(d).filter((t) => {
                  if (!t.prazoHora) return false;
                  const hour = parseInt(t.prazoHora.slice(0, 2), 10);
                  return hour === h;
                });
                return (
                  <button
                    type="button"
                    key={di}
                    onClick={() => openQuick(d, h)}
                    className="border-l border-dune-deep/10 p-1 min-h-[40px] text-left hover:bg-ember/5 transition-colors"
                  >
                    <div>
                      {slotTarefas.map((t) => (
                        <Link
                          key={t.id}
                          href={`/painel/projetos/${t.projetoId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="cal-ev"
                          title={`${t.prazoHora} ${t.titulo}`}
                        >
                          <span className="font-mono tabular-nums">{t.prazoHora}</span> {t.titulo}
                        </Link>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <QuickTarefaModal
        open={quickOpen}
        onOpenChange={setQuickOpen}
        defaultPrazo={quickPrazo}
        defaultPrazoHora={quickHora}
        projetos={projetos}
      />
    </>
  );
}
