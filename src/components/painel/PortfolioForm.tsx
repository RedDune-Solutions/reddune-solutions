"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
import type { PortfolioItem, PortfolioCategoria } from "@/types/portfolio";
import { PORTFOLIO_CATEGORIA_LABEL } from "@/types/portfolio";
import { SERVICO_SLUG } from "@/types/servico";

type Props = {
  item: PortfolioItem | null;
  onSaved?: () => void;
  onCancel?: () => void;
};

const NONE = "__none__";

export function PortfolioForm({ item, onSaved, onCancel }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [titlePt, setTitlePt] = useState(item?.title.pt ?? "");
  const [titleEn, setTitleEn] = useState(item?.title.en ?? "");
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "");
  const [url, setUrl] = useState(item?.url ?? "");
  const [categoria, setCategoria] = useState<PortfolioCategoria | null>(
    item?.categoria ?? null
  );
  const [destaqueLanding, setDestaqueLanding] = useState<boolean>(
    item?.destaqueLanding ?? false
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titlePt.trim()) {
      setError("Título PT obrigatório.");
      return;
    }
    if (destaqueLanding && !categoria) {
      setError("Para destacar na landing precisas de escolher uma categoria.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/portfolio/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item?.id,
          title: { pt: titlePt.trim(), en: titleEn.trim() || titlePt.trim() },
          imageUrl: imageUrl.trim(),
          url: url.trim(),
          categoria,
          destaqueLanding,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      startTransition(() => router.refresh());
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      <div className="space-y-1">
        <Label htmlFor="tp">Título PT *</Label>
        <Input id="tp" value={titlePt} onChange={(e) => setTitlePt(e.target.value)} required maxLength={200} disabled={saving} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="te">Título EN</Label>
        <Input id="te" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} maxLength={200} disabled={saving} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="img">URL da imagem</Label>
        <Input id="img" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." disabled={saving} className="font-mono text-xs" />
      </div>

      <div className="space-y-1">
        <Label htmlFor="url">URL do projeto</Label>
        <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." disabled={saving} className="font-mono text-xs" />
      </div>

      <div className="space-y-1">
        <Label htmlFor="cat">Categoria</Label>
        <Select
          value={categoria ?? NONE}
          onValueChange={(v) =>
            setCategoria(v === NONE ? null : (v as PortfolioCategoria))
          }
          disabled={saving}
        >
          <SelectTrigger id="cat">
            <SelectValue placeholder="Sem categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Sem categoria</SelectItem>
            {SERVICO_SLUG.map((s) => (
              <SelectItem key={s} value={s}>
                {PORTFOLIO_CATEGORIA_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <label className="flex items-start gap-2 cursor-pointer rounded-md border border-border bg-muted/30 p-3">
        <input
          type="checkbox"
          checked={destaqueLanding}
          onChange={(e) => setDestaqueLanding(e.target.checked)}
          disabled={saving || !categoria}
          className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
        />
        <span className="text-sm">
          <span className="font-medium">Destacar na landing</span>
          <span className="block text-xs text-muted-foreground mt-0.5">
            Substitui automaticamente o destaque anterior desta categoria. Precisa de categoria escolhida.
          </span>
        </span>
      </label>

      {error && (
        <p className="text-xs text-rose-600 bg-rose-500/10 border border-rose-500/20 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2 pb-6">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" aria-hidden="true" />}
          {item ? "Guardar" : "Criar trabalho"}
        </Button>
      </div>
    </form>
  );
}
