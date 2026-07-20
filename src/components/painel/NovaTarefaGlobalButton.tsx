"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TAREFAS_VISIVEIS_STATUSES, type Projeto } from "@/types/projeto";
import { safeJsonPost } from "@/lib/safe-fetch";
import { useToast } from "@/hooks/use-toast";

type Props = {
  projetos: Projeto[];
  /** Controlo externo do sheet (ex.: NovoMenu). Sem esta prop gere o próprio estado. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Esconde o botão trigger — o sheet passa a abrir apenas via `open` controlado. */
  hideTrigger?: boolean;
};

// Mostra no selector apenas projetos cujas tarefas são visíveis em
// /painel/tarefas (não arquivados/fechados). Partilhado com o filtro da página
// para que nenhuma tarefa criada fique invisível.
const ACTIVE_STATUSES = TAREFAS_VISIVEIS_STATUSES;

export function NovaTarefaGlobalButton({
  projetos,
  open: openProp,
  onOpenChange,
  hideTrigger = false,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const [projetoId, setProjetoId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [prazo, setPrazo] = useState("");
  const [prazoHora, setPrazoHora] = useState("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeProjetos = projetos
    .filter((p) => ACTIVE_STATUSES.includes(p.status))
    .sort((a, b) => a.titulo.localeCompare(b.titulo));

  function reset() {
    setProjetoId("");
    setTitulo("");
    setPrazo("");
    setPrazoHora("");
    setNotas("");
    setError(null);
  }

  function setOpen(o: boolean) {
    onOpenChange?.(o);
    if (openProp === undefined) setInternalOpen(o);
    if (!o) reset();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projetoId || !titulo.trim()) {
      setError("Projeto e título são obrigatórios.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await safeJsonPost("/api/tarefas/upsert", {
      projetoId,
      titulo: titulo.trim(),
      feita: false,
      prazo: prazo || null,
      prazoHora: prazo && prazoHora ? prazoHora : null,
      notas: notas.trim() || null,
      ordem: 0,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      toast({ title: "Erro a criar lembrete", description: res.error, variant: "destructive" });
      return;
    }
    setOpen(false);
    startTransition(() => router.refresh());
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <SheetTrigger asChild>
          <button type="button" className="btn-primary">
            <Plus className="ic" aria-hidden="true" />
            Novo lembrete
          </button>
        </SheetTrigger>
      )}
      <SheetContent side="right" className="w-full sm:max-w-md p-6">
        <SheetHeader className="px-0">
          <SheetTitle>Novo lembrete</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="proj">Projeto *</Label>
            <Select value={projetoId} onValueChange={setProjetoId} disabled={saving}>
              <SelectTrigger id="proj">
                <SelectValue placeholder="Escolhe um projeto..." />
              </SelectTrigger>
              <SelectContent>
                {activeProjetos.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    Sem projetos activos
                  </SelectItem>
                ) : (
                  activeProjetos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.titulo}
                      {p.clienteNome ? ` — ${p.clienteNome}` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="O que precisas de fazer..."
              maxLength={300}
              disabled={saving}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="prazo">Prazo (opcional)</Label>
              <Input
                id="prazo"
                type="date"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prazoHora">Hora</Label>
              <Input
                id="prazoHora"
                type="time"
                value={prazoHora}
                onChange={(e) => setPrazoHora(e.target.value)}
                disabled={saving || !prazo}
                placeholder="HH:MM"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Detalhes adicionais..."
              maxLength={1000}
              disabled={saving}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-500/10 border border-rose-500/20 rounded px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Button type="submit" disabled={saving || !projetoId || !titulo.trim()} className="flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Criar lembrete"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
