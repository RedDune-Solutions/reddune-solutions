"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  TAREFA_STATUS,
  type TarefaStatus,
} from "@/types/tarefa";

type Props = {
  tarefaId: string;
  status: TarefaStatus;
  className?: string;
  triggerClassName?: string;
  stopPropagation?: boolean;
};

export function InlineStatusSelect({
  tarefaId,
  status,
  className,
  triggerClassName,
  stopPropagation = true,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState<TarefaStatus>(status);
  const [error, setError] = useState<string | null>(null);

  async function onChange(next: string) {
    const newStatus = next as TarefaStatus;
    const previous = current;
    setCurrent(newStatus);
    setError(null);
    try {
      const res = await fetch("/api/tarefas/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tarefaId, field: "status", newValue: newStatus }),
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

  return (
    <div
      className={cn("inline-flex", className)}
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
          {TAREFA_STATUS.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <span className="sr-only">{error}</span>}
    </div>
  );
}
