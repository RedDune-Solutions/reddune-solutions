"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Trash2 } from "lucide-react";
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
import { SERVICO_SLUG, SERVICO_SLUG_LABEL, type ServicoSlug } from "@/types/servico";
import type { ProjetoTipoCustom } from "@/lib/mongodb/projeto-tipos-custom";

type Props = {
  tipos: ProjetoTipoCustom[];
};

function toSlug(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProjetoTiposCustomEditor({ tipos }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [categoria, setCategoria] = useState<ServicoSlug | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setLabel("");
    setCategoria("");
    setError(null);
    setAdding(false);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const slug = toSlug(label);
    if (!slug) { setError("Nome inválido."); return; }
    if (!categoria) { setError("Escolhe uma categoria."); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/projeto-tipos-custom/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, label: label.trim(), categoria }),
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

  async function remove(id: string, tipoLabel: string) {
    if (!confirm(`Apagar tipo "${tipoLabel}"?`)) return;
    await fetch(`/api/projeto-tipos-custom/${encodeURIComponent(id)}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  const porCategoria = SERVICO_SLUG.map((slug) => ({
    slug,
    label: SERVICO_SLUG_LABEL[slug],
    tipos: tipos.filter((t) => t.categoria === slug),
  }));

  return (
    <div className="space-y-4">
      {porCategoria.map(({ slug, label: catLabel, tipos: catTipos }) => (
        <div key={slug} className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{catLabel}</p>
          {catTipos.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Sem tipos personalizados.</p>
          ) : (
            <ul className="space-y-1">
              {catTipos.map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-sm rounded-md border border-border bg-background px-3 py-1.5">
                  <span className="flex-1 font-medium">{t.label}</span>
                  <span className="text-xs text-muted-foreground font-mono">{t.slug}</span>
                  <button
                    type="button"
                    onClick={() => remove(t.id, t.label)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded"
                    aria-label={`Apagar ${t.label}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {adding ? (
        <form onSubmit={create} className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="tipo-label">Nome</Label>
              <Input
                id="tipo-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: Instalação de SO, Cablagem…"
                maxLength={100}
                disabled={saving}
                autoFocus
              />
              {label && (
                <p className="text-[10px] text-muted-foreground font-mono">slug: {toSlug(label)}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select
                value={categoria || "__none"}
                onValueChange={(v) => setCategoria(v === "__none" ? "" : v as ServicoSlug)}
                disabled={saving}
              >
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— Escolhe —</SelectItem>
                  {SERVICO_SLUG.map((s) => (
                    <SelectItem key={s} value={s}>{SERVICO_SLUG_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <div className="flex items-center justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={saving}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={saving || !label.trim() || !categoria}>
              {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
              Criar tipo
            </Button>
          </div>
        </form>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Novo tipo
        </Button>
      )}
    </div>
  );
}
