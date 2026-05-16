"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PortfolioItem } from "@/types/portfolio";

type Props = {
  item: PortfolioItem | null;
  onSaved: () => void;
  onCancel: () => void;
};

export function PortfolioForm({ item, onSaved, onCancel }: Props) {
  const [titlePt, setTitlePt] = useState(item?.title.pt ?? "");
  const [titleEn, setTitleEn] = useState(item?.title.en ?? "");
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "");
  const [url, setUrl] = useState(item?.url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titlePt.trim()) {
      setError("Título PT obrigatório.");
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
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      onSaved();
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

      {error && (
        <p className="text-xs text-rose-600 bg-rose-500/10 border border-rose-500/20 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2 pb-6">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" aria-hidden="true" />}
          {item ? "Guardar" : "Criar trabalho"}
        </Button>
      </div>
    </form>
  );
}
