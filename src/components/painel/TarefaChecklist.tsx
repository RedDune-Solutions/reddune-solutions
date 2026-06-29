"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Tarefa } from "@/types/tarefa";
import { safeJsonPost, safeDelete } from "@/lib/safe-fetch";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";

type Props = {
  tarefas: Tarefa[];
  projetoId: string;
};

function fmtData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
  } catch {
    return iso;
  }
}

export function TarefaChecklist({ tarefas, projetoId }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [, startTransition] = useTransition();
  // Estado local optimista — reconciliado com as props quando o
  // router.refresh() traz dados novos do servidor.
  const [items, setItems] = useState<Tarefa[]>(tarefas);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoPrazo, setNovoPrazo] = useState("");
  const [novaHora, setNovaHora] = useState("");
  const [adding, setAdding] = useState(false);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    setItems(tarefas);
  }, [tarefas]);

  function setBusyId(id: string, on: boolean) {
    setBusy((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function toggleFeita(tarefa: Tarefa) {
    const novoFeita = !tarefa.feita;
    // Optimista: flipa já localmente.
    setItems((prev) => prev.map((t) => (t.id === tarefa.id ? { ...t, feita: novoFeita } : t)));
    setBusyId(tarefa.id, true);
    const res = await safeJsonPost("/api/tarefas/edit", {
      tarefaId: tarefa.id,
      patch: { feita: novoFeita },
    });
    setBusyId(tarefa.id, false);
    if (!res.ok) {
      // Revert.
      setItems((prev) => prev.map((t) => (t.id === tarefa.id ? { ...t, feita: tarefa.feita } : t)));
      toast({ title: "Erro a actualizar tarefa", description: res.error, variant: "destructive" });
      return;
    }
    startTransition(() => router.refresh());
  }

  async function updatePrazo(tarefa: Tarefa, prazo: string | null) {
    const prazoAnterior = tarefa.prazo;
    // Optimista: actualiza já localmente.
    setItems((prev) => prev.map((t) => (t.id === tarefa.id ? { ...t, prazo } : t)));
    setBusyId(tarefa.id, true);
    const res = await safeJsonPost("/api/tarefas/edit", {
      tarefaId: tarefa.id,
      patch: { prazo },
    });
    setBusyId(tarefa.id, false);
    if (!res.ok) {
      // Revert.
      setItems((prev) => prev.map((t) => (t.id === tarefa.id ? { ...t, prazo: prazoAnterior } : t)));
      toast({ title: "Erro a actualizar prazo", description: res.error, variant: "destructive" });
      return;
    }
    startTransition(() => router.refresh());
  }

  async function deletarTarefa(id: string) {
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
    setBusyId(id, true);
    const res = await safeDelete(`/api/tarefas/${encodeURIComponent(id)}`);
    setBusyId(id, false);
    if (!res.ok) {
      // Revert: repõe a tarefa.
      if (removida) setItems((prev) => (prev.some((t) => t.id === id) ? prev : [...prev, removida]));
      toast({ title: "Erro a apagar tarefa", description: res.error, variant: "destructive" });
      return;
    }
    startTransition(() => router.refresh());
  }

  async function adicionarTarefa(e: React.FormEvent) {
    e.preventDefault();
    const titulo = novoTitulo.trim();
    if (!titulo) return;
    setAdding(true);
    const res = await safeJsonPost("/api/tarefas/upsert", {
      projetoId,
      titulo,
      feita: false,
      prazo: novoPrazo || null,
      prazoHora: novoPrazo && novaHora ? novaHora : null,
      notas: null,
      ordem: items.length,
    });
    setAdding(false);
    if (!res.ok) {
      toast({ title: "Erro a adicionar tarefa", description: res.error, variant: "destructive" });
      return;
    }
    setNovoTitulo("");
    setNovoPrazo("");
    setNovaHora("");
    setShowInput(false);
    startTransition(() => router.refresh());
  }

  const pendentes = items.filter((t) => !t.feita);
  const feitas = items.filter((t) => t.feita);

  return (
    <div className="space-y-3">
      {items.length === 0 && !showInput && (
        <p className="text-sm text-muted-foreground">Sem tarefas ainda.</p>
      )}

      {pendentes.map((tarefa) => (
        <TarefaItem
          key={tarefa.id}
          tarefa={tarefa}
          onToggle={() => toggleFeita(tarefa)}
          onDelete={() => deletarTarefa(tarefa.id)}
          onPrazo={(p) => updatePrazo(tarefa, p)}
          disabled={busy.has(tarefa.id)}
        />
      ))}

      {feitas.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-muted-foreground font-mono uppercase tracking-wide select-none list-none flex items-center gap-1 mt-2">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            {feitas.length} concluída{feitas.length !== 1 ? "s" : ""}
          </summary>
          <div className="mt-2 space-y-2 opacity-60">
            {feitas.map((tarefa) => (
              <TarefaItem
                key={tarefa.id}
                tarefa={tarefa}
                onToggle={() => toggleFeita(tarefa)}
                onDelete={() => deletarTarefa(tarefa.id)}
                onPrazo={(p) => updatePrazo(tarefa, p)}
                disabled={busy.has(tarefa.id)}
              />
            ))}
          </div>
        </details>
      )}

      {showInput ? (
        <form onSubmit={adicionarTarefa} className="flex flex-wrap items-center gap-2 mt-2">
          <Input
            value={novoTitulo}
            onChange={(e) => setNovoTitulo(e.target.value)}
            placeholder="Nome da tarefa..."
            autoFocus
            maxLength={300}
            disabled={adding}
            className="h-8 text-sm flex-1 min-w-[180px]"
          />
          <Input
            type="date"
            value={novoPrazo}
            onChange={(e) => setNovoPrazo(e.target.value)}
            disabled={adding}
            className="h-8 text-sm w-[150px]"
            title="Data (opcional)"
          />
          <Input
            type="time"
            value={novaHora}
            onChange={(e) => setNovaHora(e.target.value)}
            disabled={adding || !novoPrazo}
            className="h-8 text-sm w-[110px]"
            title="Hora (opcional)"
          />
          <Button type="submit" size="sm" disabled={adding || !novoTitulo.trim()} className="h-8">
            {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Adicionar"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => { setShowInput(false); setNovoTitulo(""); setNovoPrazo(""); setNovaHora(""); }}
          >
            Cancelar
          </Button>
        </form>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-muted-foreground hover:text-foreground"
          onClick={() => setShowInput(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
          Adicionar tarefa
        </Button>
      )}
    </div>
  );
}

function TarefaItem({
  tarefa,
  onToggle,
  onDelete,
  onPrazo,
  disabled,
}: {
  tarefa: Tarefa;
  onToggle: () => void;
  onDelete: () => void;
  onPrazo: (prazo: string | null) => void;
  disabled: boolean;
}) {
  const [editingPrazo, setEditingPrazo] = useState(false);
  const [valorPrazo, setValorPrazo] = useState(tarefa.prazo ?? "");

  function commit() {
    setEditingPrazo(false);
    const v = valorPrazo.trim() || null;
    if (v !== (tarefa.prazo ?? null)) onPrazo(v);
  }

  return (
    <div className="group flex items-center gap-3 rounded-md border border-border/60 bg-card px-3 py-2">
      <input
        type="checkbox"
        checked={tarefa.feita}
        onChange={onToggle}
        disabled={disabled}
        id={`tarefa-${tarefa.id}`}
        className="h-4 w-4 rounded border-border accent-primary"
      />
      <label
        htmlFor={`tarefa-${tarefa.id}`}
        className={cn(
          "flex-1 text-sm cursor-pointer",
          tarefa.feita && "line-through text-muted-foreground"
        )}
      >
        {tarefa.titulo}
      </label>

      {editingPrazo ? (
        <Input
          type="date"
          value={valorPrazo}
          autoFocus
          onChange={(e) => setValorPrazo(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setValorPrazo(tarefa.prazo ?? ""); setEditingPrazo(false); }
          }}
          className="h-7 text-xs w-[140px]"
        />
      ) : tarefa.prazo ? (
        <button
          type="button"
          onClick={() => setEditingPrazo(true)}
          className="inline-flex items-center gap-1 text-xs tabular-nums px-1.5 py-0.5 rounded hover:bg-muted text-muted-foreground"
          title="Editar data"
        >
          <Calendar className="h-3 w-3" aria-hidden="true" />
          {fmtData(tarefa.prazo)}
          {tarefa.prazoHora && (
            <span className="font-mono">{tarefa.prazoHora}</span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setEditingPrazo(true)}
          className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity"
        >
          + Data
        </button>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        onClick={onDelete}
        disabled={disabled}
        aria-label="Apagar tarefa"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}
