"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ServicoCategoria } from "@/lib/mongodb/servico-categorias";

type Props = {
  categorias: ServicoCategoria[];
};

function toSlug(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function NovaCategoriaServicoButton({ categorias }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setLabel("");
    setError(null);
    setAdding(false);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const slug = toSlug(label);
    if (!slug) { setError("Nome inválido."); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/servico-categorias/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, label: label.trim(), ordem: categorias.length + 10 }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? `HTTP ${res.status}`);
        return;
      }
      reset();
      startTransition(() => router.refresh());
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string, catLabel: string) {
    if (!confirm(`Apagar categoria "${catLabel}"? Os serviços associados ficam sem categoria visível.`)) return;
    await fetch(`/api/servico-categorias/${encodeURIComponent(id)}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-3">
      {categorias.length > 0 && (
        <ul className="space-y-1.5">
          {categorias.map((c) => (
            <li key={c.id} className="flex items-center gap-2 text-sm">
              <span className="flex-1 font-medium">{c.label}</span>
              <span className="text-xs text-muted-foreground font-mono">{c.slug}</span>
              <button
                type="button"
                onClick={() => remove(c.id, c.label)}
                className="text-muted-foreground hover:text-destructive p-1 rounded"
                aria-label={`Apagar ${c.label}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form onSubmit={create} className="flex items-end gap-2">
          <div className="space-y-1 flex-1">
            <Label htmlFor="cat-label">Nome da categoria</Label>
            <Input
              id="cat-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Formação, Consultoria…"
              maxLength={100}
              disabled={saving}
              autoFocus
            />
            {label && (
              <p className="text-[10px] text-muted-foreground font-mono">slug: {toSlug(label)}</p>
            )}
            {error && (
              <p className="text-xs text-rose-600">{error}</p>
            )}
          </div>
          <Button type="submit" size="sm" disabled={saving || !label.trim()}>
            {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
            Criar
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={saving}>
            Cancelar
          </Button>
        </form>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Nova categoria
        </Button>
      )}
    </div>
  );
}
