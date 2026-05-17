"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  SERVICO_SLUG_LABEL,
  type Servico,
  type ServicoSlug,
} from "@/types/servico";

type Props = {
  slug: ServicoSlug;
  servicos: Servico[];
};

type Draft = {
  id: string | null;          // null = ainda não persistido
  titulo: string;
  descricao: string;
  precoBase: string;          // input string
  precoTexto: string;
  nota: string;
  ordem: number;
  ativo: boolean;
  dirty: boolean;
};

function toDraft(s: Servico): Draft {
  return {
    id: s.id,
    titulo: s.titulo,
    descricao: s.descricao ?? "",
    precoBase: s.precoBase != null ? String(s.precoBase) : "",
    precoTexto: s.precoTexto ?? "",
    nota: s.nota ?? "",
    ordem: s.ordem,
    ativo: s.ativo,
    dirty: false,
  };
}

function emptyDraft(ordem: number): Draft {
  return {
    id: null,
    titulo: "",
    descricao: "",
    precoBase: "",
    precoTexto: "",
    nota: "",
    ordem,
    ativo: true,
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

  function addNovo() {
    setItems((prev) => [...prev, emptyDraft(prev.length)]);
  }

  async function save(idx: number) {
    const d = items[idx];
    if (!d.titulo.trim()) {
      setError("Título obrigatório.");
      return;
    }
    setSavingId(d.id ?? `new_${idx}`);
    setError(null);
    try {
      const precoBase = d.precoBase.trim() ? parseFloat(d.precoBase.replace(",", ".")) : null;
      const payload = {
        id: d.id ?? undefined,
        slug,
        titulo: d.titulo.trim(),
        descricao: d.descricao.trim() || null,
        precoBase: precoBase != null && Number.isFinite(precoBase) ? precoBase : null,
        precoTexto: d.precoTexto.trim() || null,
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
    const d = items[idx];
    if (d.id) {
      if (!confirm(`Apagar "${d.titulo}"?`)) return;
      await fetch(`/api/servicos/${encodeURIComponent(d.id)}`, { method: "DELETE" });
    }
    setItems((prev) => prev.filter((_, i) => i !== idx));
    startTransition(() => router.refresh());
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-headline text-lg font-semibold">{SERVICO_SLUG_LABEL[slug]}</h2>
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
            <div key={d.id ?? `new_${idx}`} className="rounded-md border border-border bg-background p-3 space-y-2">
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-12 sm:col-span-6 space-y-1">
                  <Label className="text-[10px] uppercase">Título *</Label>
                  <Input
                    value={d.titulo}
                    onChange={(e) => update(idx, { titulo: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="col-span-6 sm:col-span-3 space-y-1">
                  <Label className="text-[10px] uppercase">Preço (€)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min="0"
                    value={d.precoBase}
                    onChange={(e) => update(idx, { precoBase: e.target.value })}
                    placeholder="—"
                    className="h-8 text-sm tabular-nums"
                    disabled={!!d.precoTexto.trim()}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2 space-y-1">
                  <Label className="text-[10px] uppercase">Ordem</Label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={d.ordem}
                    onChange={(e) => update(idx, { ordem: parseInt(e.target.value, 10) || 0 })}
                    className="h-8 text-sm tabular-nums"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 flex items-end justify-center">
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

              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-12 sm:col-span-6 space-y-1">
                  <Label className="text-[10px] uppercase">Nota (sufixo do preço)</Label>
                  <Input
                    value={d.nota}
                    onChange={(e) => update(idx, { nota: e.target.value })}
                    placeholder="ex: abatido se reparares"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="col-span-12 sm:col-span-6 space-y-1">
                  <Label className="text-[10px] uppercase">Preço override (texto livre)</Label>
                  <Input
                    value={d.precoTexto}
                    onChange={(e) => update(idx, { precoTexto: e.target.value })}
                    placeholder='ex: "Desktop 20€ · Portátil 25€" — usa quando preço base não chega'
                    className="h-8 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase">Descrição</Label>
                <Textarea
                  value={d.descricao}
                  onChange={(e) => update(idx, { descricao: e.target.value })}
                  rows={2}
                  className="text-sm"
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
    </section>
  );
}
