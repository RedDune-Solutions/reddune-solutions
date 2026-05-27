"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORIA_TIPOS,
  PROJETO_TIPO_LABEL,
  type ProjetoTipo,
} from "@/types/projeto";
import { SERVICO_SLUG, SERVICO_SLUG_LABEL, type ServicoSlug } from "@/types/servico";
import type { TarefaTemplate, TarefaTemplateItem } from "@/types/tarefa-template";
import { safeJsonPost, safeDelete } from "@/lib/safe-fetch";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";

type Props = {
  templates: TarefaTemplate[];
};

type Draft = {
  id: string | null;
  nome: string;
  categoria: ServicoSlug | null;
  tipos: ProjetoTipo[];
  itens: TarefaTemplateItem[];
  criadoEm: string | null;
  dirty: boolean;
};

function toDraft(t: TarefaTemplate): Draft {
  return {
    id: t.id,
    nome: t.nome,
    categoria: t.categoria,
    tipos: t.tipos ?? [],
    itens: [...(t.itens ?? [])].sort((a, b) => a.ordem - b.ordem),
    criadoEm: t.criadoEm,
    dirty: false,
  };
}

function emptyDraft(): Draft {
  return {
    id: null,
    nome: "",
    categoria: null,
    tipos: [],
    itens: [],
    criadoEm: null,
    dirty: true,
  };
}

export function TemplatesEditor({ templates }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [, startTransition] = useTransition();
  const [items, setItems] = useState<Draft[]>(templates.map(toDraft));
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update(idx: number, patch: Partial<Draft>) {
    setItems((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, ...patch, dirty: true } : d))
    );
  }

  function toggleTipo(idx: number, tipo: ProjetoTipo) {
    setItems((prev) =>
      prev.map((d, i) => {
        if (i !== idx) return d;
        const has = d.tipos.includes(tipo);
        return {
          ...d,
          tipos: has ? d.tipos.filter((t) => t !== tipo) : [...d.tipos, tipo],
          dirty: true,
        };
      })
    );
  }

  function addItem(idx: number) {
    setItems((prev) =>
      prev.map((d, i) => {
        if (i !== idx) return d;
        return {
          ...d,
          itens: [...d.itens, { titulo: "", ordem: d.itens.length }],
          dirty: true,
        };
      })
    );
  }

  function updateItem(idx: number, iIdx: number, titulo: string) {
    setItems((prev) =>
      prev.map((d, i) => {
        if (i !== idx) return d;
        const next = [...d.itens];
        next[iIdx] = { ...next[iIdx]!, titulo };
        return { ...d, itens: next, dirty: true };
      })
    );
  }

  function removeItem(idx: number, iIdx: number) {
    setItems((prev) =>
      prev.map((d, i) => {
        if (i !== idx) return d;
        return {
          ...d,
          itens: d.itens
            .filter((_, j) => j !== iIdx)
            .map((it, j) => ({ ...it, ordem: j })),
          dirty: true,
        };
      })
    );
  }

  function addNovo() {
    setItems((prev) => [...prev, emptyDraft()]);
  }

  async function save(idx: number) {
    const d = items[idx]!;
    if (!d.nome.trim()) {
      setError("Nome obrigatório.");
      return;
    }
    setSavingId(d.id ?? `new_${idx}`);
    setError(null);
    const payload = {
      id: d.id ?? undefined,
      nome: d.nome.trim(),
      categoria: d.categoria,
      tipos: d.tipos,
      itens: d.itens
        .filter((it) => it.titulo.trim())
        .map((it, i) => ({ titulo: it.titulo.trim(), ordem: i })),
      criadoEm: d.criadoEm ?? new Date().toISOString(),
    };
    const res = await safeJsonPost<{ id: string }>("/api/tarefa-templates/upsert", payload);
    setSavingId(null);
    if (!res.ok) {
      setError(res.error);
      toast({ title: "Erro a guardar template", description: res.error, variant: "destructive" });
      return;
    }
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx ? { ...it, id: res.data.id, dirty: false, criadoEm: payload.criadoEm } : it
      )
    );
    startTransition(() => router.refresh());
  }

  async function remove(idx: number) {
    const d = items[idx]!;
    if (d.id) {
      const ok = await confirm({
        title: `Apagar template "${d.nome}"?`,
        description: "Remove o template. Tarefas já criadas a partir dele mantêm-se.",
        confirmLabel: "Apagar",
        tone: "destructive",
      });
      if (!ok) return;
      const res = await safeDelete(`/api/tarefa-templates/${encodeURIComponent(d.id)}`);
      if (!res.ok) {
        toast({ title: "Erro a apagar template", description: res.error, variant: "destructive" });
        return;
      }
    }
    setItems((prev) => prev.filter((_, i) => i !== idx));
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button size="sm" variant="outline" onClick={addNovo}>
          <Plus className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
          Adicionar template
        </Button>
      </div>

      {error && (
        <p className="text-xs text-rose-600 bg-rose-500/10 border border-rose-500/20 rounded px-2 py-1">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Sem templates. Adiciona o primeiro.</p>
      ) : (
        <div className="space-y-3">
          {items.map((d, idx) => (
            <div
              key={d.id ?? `new_${idx}`}
              className="rounded-md border border-border-strong bg-surface-elevated p-3 space-y-3"
            >
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-12 sm:col-span-8 space-y-1">
                  <Label className="text-[10px] uppercase font-semibold text-foreground/80 tracking-wide">
                    Nome *
                  </Label>
                  <Input
                    value={d.nome}
                    onChange={(e) => update(idx, { nome: e.target.value })}
                    className="h-8 text-sm border-border-strong bg-background"
                  />
                </div>
                <div className="col-span-12 sm:col-span-4 space-y-1">
                  <Label className="text-[10px] uppercase font-semibold text-foreground/80 tracking-wide">
                    Categoria
                  </Label>
                  <Select
                    value={d.categoria ?? "__none"}
                    onValueChange={(v) =>
                      update(idx, { categoria: v === "__none" ? null : (v as ServicoSlug) })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm border-border-strong bg-background">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">— Nenhuma —</SelectItem>
                      {SERVICO_SLUG.map((s) => (
                        <SelectItem key={s} value={s}>
                          {SERVICO_SLUG_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-semibold text-foreground/80 tracking-wide">
                  Tipos aplicáveis
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 rounded border border-dashed border-border-strong bg-muted/30">
                  {(Object.keys(CATEGORIA_TIPOS) as ServicoSlug[]).map((cat) => (
                    <div key={cat} className="space-y-1">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {SERVICO_SLUG_LABEL[cat]}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {CATEGORIA_TIPOS[cat].map((t) => {
                          const active = d.tipos.includes(t);
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => toggleTipo(idx, t)}
                              className={
                                "text-[10px] px-1.5 py-0.5 rounded border transition-colors " +
                                (active
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background text-foreground/70 border-border hover:bg-muted")
                              }
                            >
                              {PROJETO_TIPO_LABEL[t]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-semibold text-foreground/80 tracking-wide">
                  Itens ({d.itens.length})
                </Label>
                <div className="space-y-1.5">
                  {d.itens.map((it, iIdx) => (
                    <div key={iIdx} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono w-5 text-muted-foreground tabular-nums">
                        {iIdx + 1}.
                      </span>
                      <Input
                        value={it.titulo}
                        onChange={(e) => updateItem(idx, iIdx, e.target.value)}
                        placeholder="Título da tarefa"
                        className="h-8 text-sm border-border-strong bg-background flex-1"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem(idx, iIdx)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        aria-label="Remover item"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addItem(idx)}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                  Adicionar item
                </Button>
              </div>

              <div className="flex items-center justify-end gap-2">
                {d.dirty && (
                  <Button
                    size="sm"
                    onClick={() => save(idx)}
                    disabled={savingId === (d.id ?? `new_${idx}`)}
                  >
                    {savingId === (d.id ?? `new_${idx}`) && (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" aria-hidden="true" />
                    )}
                    Guardar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remove(idx)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
