"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  type Servico,
  type VariantePreco,
} from "@/types/servico";
import { parseMoney } from "@/lib/parse-number";

type Props = {
  slug: string;
  servicos: Servico[];
};

type VarianteDraft = { label: string; preco: string; precoMax: string };

type Draft = {
  id: string | null;
  titulo: string;
  descricao: string;
  precoBase: string;
  precoMax: string;
  precoDesde: boolean;
  precoTexto: string; // preservado mas não editável (legacy)
  nota: string;
  ordem: number;
  ativo: boolean;
  temVariantes: boolean;
  variantes: VarianteDraft[];
  dirty: boolean;
};

const DEFAULT_LABELS = ["Desktop", "Portátil", "Consola"];

function toDraft(s: Servico): Draft {
  const temVariantes = !!(s.variantes && s.variantes.length > 0);
  return {
    id: s.id,
    titulo: s.titulo,
    descricao: s.descricao ?? "",
    precoBase: s.precoBase != null ? String(s.precoBase) : "",
    precoMax: s.precoMax != null ? String(s.precoMax) : "",
    precoDesde: s.precoDesde ?? false,
    precoTexto: s.precoTexto ?? "",
    nota: s.nota ?? "",
    ordem: s.ordem,
    ativo: s.ativo,
    temVariantes,
    variantes: temVariantes
      ? s.variantes!.map((v) => ({
          label: v.label,
          preco: String(v.preco),
          precoMax: v.precoMax != null ? String(v.precoMax) : "",
        }))
      : [],
    dirty: false,
  };
}

function emptyDraft(ordem: number): Draft {
  return {
    id: null,
    titulo: "",
    descricao: "",
    precoBase: "",
    precoMax: "",
    precoDesde: false,
    precoTexto: "",
    nota: "",
    ordem,
    ativo: true,
    temVariantes: false,
    variantes: [],
    dirty: true,
  };
}

export function ServicosEditor({ slug, servicos }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [items, setItems] = useState<Draft[]>(servicos.map(toDraft));
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update(idx: number, patch: Partial<Draft>) {
    setItems((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, ...patch, dirty: true } : d))
    );
  }

  function updateVariante(idx: number, vIdx: number, patch: Partial<VarianteDraft>) {
    setItems((prev) =>
      prev.map((d, i) => {
        if (i !== idx) return d;
        const next = [...d.variantes];
        next[vIdx] = { ...next[vIdx]!, ...patch };
        return { ...d, variantes: next, dirty: true };
      })
    );
  }

  function addVariante(idx: number) {
    setItems((prev) =>
      prev.map((d, i) => {
        if (i !== idx) return d;
        const label = DEFAULT_LABELS[d.variantes.length] ?? "";
        return {
          ...d,
          variantes: [...d.variantes, { label, preco: "", precoMax: "" }],
          dirty: true,
        };
      })
    );
  }

  function removeVariante(idx: number, vIdx: number) {
    setItems((prev) =>
      prev.map((d, i) => {
        if (i !== idx) return d;
        return { ...d, variantes: d.variantes.filter((_, j) => j !== vIdx), dirty: true };
      })
    );
  }

  function toggleVariantes(idx: number, on: boolean) {
    setItems((prev) =>
      prev.map((d, i) => {
        if (i !== idx) return d;
        if (on && d.variantes.length === 0) {
          // Seed com 2 variantes default
          return {
            ...d,
            temVariantes: true,
            variantes: [
              { label: "Desktop", preco: "", precoMax: "" },
              { label: "Portátil", preco: "", precoMax: "" },
            ],
            dirty: true,
          };
        }
        return { ...d, temVariantes: on, dirty: true };
      })
    );
  }

  function addNovo() {
    setItems((prev) => [...prev, emptyDraft(prev.length)]);
  }

  async function save(idx: number) {
    const d = items[idx]!;
    if (!d.titulo.trim()) {
      setError("Título obrigatório.");
      return;
    }

    let variantesPayload: VariantePreco[] | null = null;
    if (d.temVariantes && d.variantes.length > 0) {
      const parsed: VariantePreco[] = [];
      for (const v of d.variantes) {
        if (!v.label.trim()) {
          setError("Todas as variantes precisam de um label.");
          return;
        }
        const n = parseMoney(v.preco);
        if (n == null || n < 0) {
          setError(`Preço inválido na variante "${v.label}".`);
          return;
        }
        const nMax = v.precoMax.trim() ? parseMoney(v.precoMax) : null;
        parsed.push({ label: v.label.trim(), preco: n, precoMax: nMax ?? null });
      }
      variantesPayload = parsed;
    }

    setSavingId(d.id ?? `new_${idx}`);
    setError(null);
    try {
      const precoBase = d.precoBase.trim() ? parseMoney(d.precoBase) : null;
      const precoMax = d.precoMax.trim() ? parseMoney(d.precoMax) : null;
      const payload = {
        id: d.id ?? undefined,
        slug,
        titulo: d.titulo.trim(),
        descricao: d.descricao.trim() || null,
        precoBase:
          variantesPayload
            ? null
            : precoBase != null && Number.isFinite(precoBase) ? precoBase : null,
        precoMax:
          variantesPayload
            ? null
            : precoMax != null && Number.isFinite(precoMax) ? precoMax : null,
        precoDesde: !variantesPayload && d.precoDesde,
        variantes: variantesPayload,
        nota: d.nota.trim() || null,
        ordem: d.ordem,
        ativo: d.ativo,
      };
      const res = await fetch("/api/servicos/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? `HTTP ${res.status}`);
        return;
      }
      const j = await res.json();
      setItems((prev) =>
        prev.map((it, i) => (i === idx ? { ...it, id: j.id, dirty: false } : it))
      );
      startTransition(() => router.refresh());
    } finally {
      setSavingId(null);
    }
  }

  async function remove(idx: number) {
    const d = items[idx]!;
    if (d.id) {
      if (!confirm(`Apagar "${d.titulo}"?`)) return;
      await fetch(`/api/servicos/${encodeURIComponent(d.id)}`, { method: "DELETE" });
    }
    setItems((prev) => prev.filter((_, i) => i !== idx));
    startTransition(() => router.refresh());
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-end">
        <Button size="sm" variant="outline" onClick={addNovo}>
          <Plus className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
          Adicionar
        </Button>
      </div>

      {error && (
        <p className="text-xs text-rose-600 bg-rose-500/10 border border-rose-500/20 rounded px-2 py-1">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Sem serviços. Adiciona o primeiro.</p>
      ) : (
        <div className="space-y-3">
          {items.map((d, idx) => (
            <div key={d.id ?? `new_${idx}`} className="rounded-md border border-border-strong bg-surface-elevated p-3 space-y-3">
              {/* Linha 1: Título / Ordem / Activo */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-12 sm:col-span-8 space-y-1">
                  <Label className="text-[10px] uppercase font-semibold text-foreground/80 tracking-wide">Título *</Label>
                  <Input
                    value={d.titulo}
                    onChange={(e) => update(idx, { titulo: e.target.value })}
                    className="h-8 text-base font-medium border-border-strong bg-background"
                  />
                </div>
                <div className="col-span-6 sm:col-span-2 space-y-1">
                  <Label className="text-[10px] uppercase font-semibold text-foreground/80 tracking-wide">Ordem</Label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={d.ordem}
                    onChange={(e) => update(idx, { ordem: parseInt(e.target.value, 10) || 0 })}
                    className="h-8 text-sm tabular-nums border-border-strong bg-background"
                  />
                </div>
                <div className="col-span-6 sm:col-span-2 flex items-end justify-center">
                  <label className="inline-flex items-center gap-1 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={d.ativo}
                      onChange={(e) => update(idx, { ativo: e.target.checked })}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    Activo
                  </label>
                </div>
              </div>

              {/* Bloco de preço: toggle variantes */}
              <div className="rounded border border-dashed border-border-strong bg-muted/50 p-2.5 space-y-2">
                <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={d.temVariantes}
                    onChange={(e) => toggleVariantes(idx, e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="font-medium">Tem variantes</span>
                  <span className="text-muted-foreground">(ex: desktop / portátil / consola)</span>
                </label>

                {!d.temVariantes ? (
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-5 sm:col-span-3 space-y-1">
                      <Label className="text-[10px] uppercase font-semibold text-foreground/80 tracking-wide">Preço mín (€)</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        step="1"
                        min="0"
                        value={d.precoBase}
                        onChange={(e) => update(idx, { precoBase: e.target.value })}
                        placeholder="—"
                        className="h-8 text-sm tabular-nums border-border-strong bg-background"
                      />
                    </div>
                    <div className="col-span-5 sm:col-span-3 space-y-1">
                      <Label className="text-[10px] uppercase font-semibold text-foreground/80 tracking-wide">Preço máx (€)</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        step="1"
                        min="0"
                        value={d.precoMax}
                        onChange={(e) => update(idx, { precoMax: e.target.value })}
                        placeholder="opcional"
                        className="h-8 text-sm tabular-nums border-border-strong bg-background"
                      />
                    </div>
                    <div className="col-span-12 sm:col-span-6 space-y-1">
                      <Label className="text-[10px] uppercase font-semibold text-foreground/80 tracking-wide">Nota (sufixo)</Label>
                      <Input
                        value={d.nota}
                        onChange={(e) => update(idx, { nota: e.target.value })}
                        placeholder="ex: abatido se reparares"
                        className="h-8 text-sm border-border-strong bg-background"
                      />
                    </div>
                    <div className="col-span-12 flex items-center gap-2 pt-1">
                      <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={d.precoDesde}
                          onChange={(e) => update(idx, { precoDesde: e.target.checked })}
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                        <span>Mostrar como <b>desde X€</b> (máximo indefinido)</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="space-y-1.5">
                      {d.variantes.map((v, vIdx) => (
                        <div key={vIdx} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-12 sm:col-span-4 space-y-1">
                            <Label className="text-[10px] uppercase font-semibold text-foreground/80 tracking-wide">Label</Label>
                            <Input
                              value={v.label}
                              onChange={(e) => updateVariante(idx, vIdx, { label: e.target.value })}
                              placeholder="Desktop"
                              className="h-8 text-sm border-border-strong bg-background"
                            />
                          </div>
                          <div className="col-span-5 sm:col-span-3 space-y-1">
                            <Label className="text-[10px] uppercase font-semibold text-foreground/80 tracking-wide">Mín (€)</Label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              step="1"
                              min="0"
                              value={v.preco}
                              onChange={(e) => updateVariante(idx, vIdx, { preco: e.target.value })}
                              className="h-8 text-sm tabular-nums border-border-strong bg-background"
                            />
                          </div>
                          <div className="col-span-5 sm:col-span-3 space-y-1">
                            <Label className="text-[10px] uppercase font-semibold text-foreground/80 tracking-wide">Máx (€)</Label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              step="1"
                              min="0"
                              value={v.precoMax}
                              onChange={(e) => updateVariante(idx, vIdx, { precoMax: e.target.value })}
                              placeholder="opcional"
                              className="h-8 text-sm tabular-nums border-border-strong bg-background"
                            />
                          </div>
                          <div className="col-span-2 sm:col-span-2 flex items-end justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeVariante(idx, vIdx)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              aria-label="Remover variante"
                            >
                              <X className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addVariante(idx)}
                      className="h-7 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                      Adicionar variante
                    </Button>
                    <div className="space-y-1 pt-1">
                      <Label className="text-[10px] uppercase font-semibold text-foreground/80 tracking-wide">Nota (sufixo)</Label>
                      <Input
                        value={d.nota}
                        onChange={(e) => update(idx, { nota: e.target.value })}
                        placeholder="opcional"
                        className="h-8 text-sm border-border-strong bg-background"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Descrição */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-semibold text-foreground/80 tracking-wide">Descrição</Label>
                <Textarea
                  value={d.descricao}
                  onChange={(e) => update(idx, { descricao: e.target.value })}
                  rows={2}
                  className="text-sm border-border-strong bg-background"
                />
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
