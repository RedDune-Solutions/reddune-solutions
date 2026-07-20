"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Check } from "lucide-react";
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
      toast({ title: "Erro a actualizar lembrete", description: res.error, variant: "destructive" });
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
      title: "Apagar lembrete?",
      description: "Esta acção remove o lembrete. Não pode ser desfeita.",
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
      toast({ title: "Erro a apagar lembrete", description: res.error, variant: "destructive" });
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
      toast({ title: "Erro a adicionar lembrete", description: res.error, variant: "destructive" });
      return;
    }
    setNovoTitulo("");
    setNovoPrazo("");
    setNovaHora("");
    setShowInput(false);
    startTransition(() => router.refresh());
  }

  // Como no protótipo: pendentes primeiro, feitas (.trow.done) a seguir.
  const pendentes = items.filter((t) => !t.feita);
  const feitas = items.filter((t) => t.feita);

  return (
    <div>
      {items.length === 0 && !showInput && (
        <p style={{ fontSize: 13, color: "var(--ink-mute)", margin: "0 0 8px" }}>
          Sem lembretes ainda.
        </p>
      )}

      {[...pendentes, ...feitas].map((tarefa) => (
        <TarefaItem
          key={tarefa.id}
          tarefa={tarefa}
          onToggle={() => toggleFeita(tarefa)}
          onDelete={() => deletarTarefa(tarefa.id)}
          onPrazo={(p) => updatePrazo(tarefa, p)}
          disabled={busy.has(tarefa.id)}
        />
      ))}

      {showInput ? (
        <form
          onSubmit={adicionarTarefa}
          style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 4 }}
        >
          <input
            className="in-sm"
            style={{ flex: 1, minWidth: 180 }}
            value={novoTitulo}
            onChange={(e) => setNovoTitulo(e.target.value)}
            placeholder="Nome do lembrete…"
            autoFocus
            maxLength={300}
            disabled={adding}
          />
          <input
            className="in-sm"
            type="date"
            value={novoPrazo}
            onChange={(e) => setNovoPrazo(e.target.value)}
            disabled={adding}
            title="Data (opcional)"
          />
          <input
            className="in-sm"
            type="time"
            value={novaHora}
            onChange={(e) => setNovaHora(e.target.value)}
            disabled={adding || !novoPrazo}
            title="Hora (opcional)"
          />
          <button type="submit" className="btn-primary" disabled={adding || !novoTitulo.trim()}>
            {adding ? (
              <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} aria-hidden="true" />
            ) : (
              "Adicionar"
            )}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => { setShowInput(false); setNovoTitulo(""); setNovoPrazo(""); setNovaHora(""); }}
          >
            Cancelar
          </button>
        </form>
      ) : (
        <button
          type="button"
          className="btn-ghost"
          style={{ marginTop: 4 }}
          onClick={() => setShowInput(true)}
        >
          <Plus style={{ width: 13, height: 13 }} aria-hidden="true" />
          Adicionar lembrete
        </button>
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
    <div className={cn("trow", tarefa.feita && "done")}>
      <button
        type="button"
        className="check"
        onClick={onToggle}
        disabled={disabled}
        aria-label={tarefa.feita ? "Marcar como não feito" : "Marcar como feito"}
      >
        {tarefa.feita && <Check aria-hidden="true" />}
      </button>
      <span className="t-title">{tarefa.titulo}</span>

      {editingPrazo ? (
        <input
          type="date"
          className="in-sm"
          value={valorPrazo}
          autoFocus
          onChange={(e) => setValorPrazo(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setValorPrazo(tarefa.prazo ?? ""); setEditingPrazo(false); }
          }}
        />
      ) : tarefa.prazo ? (
        <button
          type="button"
          className="t-time"
          style={{ background: "none", border: 0, cursor: "pointer", padding: 0 }}
          onClick={() => setEditingPrazo(true)}
          title="Editar data"
        >
          {fmtData(tarefa.prazo)}
          {tarefa.prazoHora ? ` · ${tarefa.prazoHora}` : ""}
        </button>
      ) : (
        <button
          type="button"
          className="t-time"
          style={{ background: "none", border: 0, cursor: "pointer", padding: 0 }}
          onClick={() => setEditingPrazo(true)}
          title="Definir data"
        >
          + data
        </button>
      )}

      <button
        type="button"
        className="icon-mini"
        onClick={onDelete}
        disabled={disabled}
        aria-label="Apagar lembrete"
        title="Apagar lembrete"
      >
        <Trash2 aria-hidden="true" />
      </button>
    </div>
  );
}
