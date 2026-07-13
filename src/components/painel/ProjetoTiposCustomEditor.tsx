"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X, RotateCcw } from "lucide-react";
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
import { CATEGORIA_TIPOS, PROJETO_TIPO_LABEL, type ProjetoTipo } from "@/types/projeto";
import type { ProjetoTipoCustom } from "@/lib/mongodb/projeto-tipos-custom";
import { safeJsonPost, safeDelete } from "@/lib/safe-fetch";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";

type Props = {
  tipos: ProjetoTipoCustom[];
  baseRemovidos: string[];
};

const chipBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: 1,
  borderRadius: 999,
  background: "none",
  border: 0,
  color: "inherit",
  cursor: "pointer",
};

function toSlug(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProjetoTiposCustomEditor({ tipos, baseRemovidos }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [, startTransition] = useTransition();
  const removidos = new Set(baseRemovidos);
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
    const res = await safeJsonPost("/api/projeto-tipos-custom/upsert", {
      slug,
      label: label.trim(),
      categoria,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      toast({ title: "Erro a criar tipo", description: res.error, variant: "destructive" });
      return;
    }
    reset();
    startTransition(() => router.refresh());
  }

  async function remove(id: string, tipoLabel: string) {
    const ok = await confirm({
      title: `Apagar tipo "${tipoLabel}"?`,
      description: "Projectos existentes com este tipo mantêm o nome, mas não vai aparecer na lista de tipos disponíveis.",
      confirmLabel: "Apagar",
      tone: "destructive",
    });
    if (!ok) return;
    const res = await safeDelete(`/api/projeto-tipos-custom/${encodeURIComponent(id)}`);
    if (!res.ok) {
      toast({ title: "Erro a apagar tipo", description: res.error, variant: "destructive" });
      return;
    }
    startTransition(() => router.refresh());
  }

  // Tipos base: remover = esconder do picker (não apaga; reversível). Repor
  // trá-lo de volta. Projectos que já o usam mantêm o nome.
  async function toggleBase(slug: ProjetoTipo, removido: boolean) {
    const res = await safeJsonPost("/api/projeto-tipos-base", { slug, removido });
    if (!res.ok) {
      toast({ title: "Erro a alterar tipo", description: res.error, variant: "destructive" });
      return;
    }
    startTransition(() => router.refresh());
  }

  const porCategoria = SERVICO_SLUG.map((slug) => {
    const base = CATEGORIA_TIPOS[slug];
    return {
      slug,
      label: SERVICO_SLUG_LABEL[slug],
      baseActivos: base.filter((t) => !removidos.has(t)),
      baseRemovidos: base.filter((t) => removidos.has(t)),
      custom: tipos.filter((t) => t.categoria === slug),
    };
  });

  return (
    <div className="space-y-4">
      {porCategoria.map(({ slug, label: catLabel, baseActivos, baseRemovidos: baseOff, custom }) => (
        <div key={slug}>
          <p className="plabel">{catLabel}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {/* Tipos base activos — removíveis (esconde do picker) */}
            {baseActivos.map((t) => (
              <span key={t} className="chip on">
                {PROJETO_TIPO_LABEL[t]}
                <button
                  type="button"
                  onClick={() => toggleBase(t, true)}
                  style={chipBtn}
                  aria-label={`Remover ${PROJETO_TIPO_LABEL[t]}`}
                  title="Remover do picker"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </span>
            ))}
            {/* Tipos personalizados — apagar (permanente) */}
            {custom.map((t) => (
              <span key={t.id} className="chip on">
                {t.label}
                <button
                  type="button"
                  onClick={() => remove(t.id, t.label)}
                  style={chipBtn}
                  aria-label={`Apagar ${t.label}`}
                  title="Apagar tipo personalizado"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </span>
            ))}
            {/* Tipos base removidos — repor */}
            {baseOff.map((t) => (
              <span key={t} className="chip" style={{ opacity: 0.55 }}>
                {PROJETO_TIPO_LABEL[t]}
                <button
                  type="button"
                  onClick={() => toggleBase(t, false)}
                  style={chipBtn}
                  aria-label={`Repor ${PROJETO_TIPO_LABEL[t]}`}
                  title="Repor no picker"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
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
        <button type="button" className="btn-ghost" onClick={() => setAdding(true)}>
          <Plus className="ic" aria-hidden="true" style={{ width: 14, height: 14 }} />
          Adicionar tipo
        </button>
      )}
    </div>
  );
}
