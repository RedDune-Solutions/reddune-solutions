"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, ThumbsUp, Lock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  STATUS_LABELS,
  PROJETO_STATUS,
  type ProjetoStatus,
} from "@/types/projeto";

type Props = {
  projetoId: string;
  status: ProjetoStatus;
  className?: string;
  triggerClassName?: string;
  stopPropagation?: boolean;
  pagoTotal?: number;
  valorEstimado?: number | null;
};

type QuickAction = { icon: React.ReactNode; label: string; target: ProjetoStatus };

export function InlineStatusSelect({
  projetoId,
  status,
  className,
  triggerClassName,
  stopPropagation = true,
  pagoTotal,
  valorEstimado,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState<ProjetoStatus>(status);
  const [error, setError] = useState<string | null>(null);

  async function onChange(next: string) {
    const newStatus = next as ProjetoStatus;
    const previous = current;
    setCurrent(newStatus);
    setError(null);
    try {
      const res = await fetch("/api/projetos/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projetoId, field: "status", newValue: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `HTTP ${res.status}`);
        setCurrent(previous);
        return;
      }
      startTransition(() => router.refresh());
    } catch (e) {
      setError((e as Error).message);
      setCurrent(previous);
    }
  }

  const quickActions: QuickAction[] = [];
  if (current === "ideia-cliente") {
    quickActions.push({ icon: <ThumbsUp className="h-3.5 w-3.5" />, label: "Confirmar", target: "proximo" });
  }
  if (current === "em-curso") {
    quickActions.push({ icon: <CheckCheck className="h-3.5 w-3.5" />, label: "Terminar", target: "terminado" });
  }
  if (current === "aguardando-cliente") {
    quickActions.push({ icon: <ThumbsUp className="h-3.5 w-3.5" />, label: "Aceito", target: "aguardando-encomenda" });
  }
  if (current === "terminado") {
    const liquidado =
      valorEstimado == null ||
      (pagoTotal != null && pagoTotal >= valorEstimado);
    if (liquidado) {
      quickActions.push({ icon: <Lock className="h-3.5 w-3.5" />, label: "Fechar", target: "fechado" });
    }
  }

  return (
    <div
      className={cn("inline-flex items-center gap-1", className)}
      onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
      onPointerDown={stopPropagation ? (e) => e.stopPropagation() : undefined}
    >
      <Select value={current} onValueChange={onChange} disabled={pending}>
        <SelectTrigger
          className={cn(
            "h-7 px-2 py-0 text-[10px] font-mono font-semibold uppercase tracking-tight rounded-btn border-dune-deep/15 bg-white/80 min-w-[120px]",
            triggerClassName
          )}
          aria-label={`Mudar estado (actual: ${STATUS_LABELS[current]})`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PROJETO_STATUS.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {quickActions.map((qa) => (
        <button
          key={qa.target}
          type="button"
          title={qa.label}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onChange(qa.target);
          }}
          disabled={pending}
          className="h-7 w-7 flex items-center justify-center rounded-btn border border-dune-deep/15 bg-white/60 hover:bg-ember/10 transition-colors text-ink-soft hover:text-ink"
        >
          {qa.icon}
        </button>
      ))}
      {error && <span className="sr-only">{error}</span>}
    </div>
  );
}
