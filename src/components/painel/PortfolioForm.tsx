"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Copy } from "lucide-react";
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
import { safeJsonPost } from "@/lib/safe-fetch";
import { useToast } from "@/hooks/use-toast";
import { ImageUploadZone } from "./ImageUploadZone";

type Props = {
  item: PortfolioItem | null;
  onSaved?: () => void;
  onCancel?: () => void;
  /** Se definido, redireciona para este caminho após guardar com sucesso. */
  backHref?: string;
};

const NONE = "__none__";

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function PortfolioForm({ item, onSaved, onCancel, backHref }: Props) {
  const router = useRouter();
  const { toast } = useToast();
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
    const trimmedUrl = url.trim();
    if (trimmedUrl && !isValidHttpUrl(trimmedUrl)) {
      const msg = "URL inválido. Usa um endereço http(s) completo (ex: https://exemplo.pt).";
      setError(msg);
      toast({ title: "URL inválido", description: msg, variant: "destructive" });
      return;
    }
    setSaving(true);
    setError(null);
    const res = await safeJsonPost("/api/portfolio/upsert", {
      id: item?.id,
      title: { pt: titlePt.trim(), en: titleEn.trim() || titlePt.trim() },
      imageUrl: imageUrl.trim(),
      url: trimmedUrl,
      categoria,
      destaqueLanding,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      toast({ title: "Erro a guardar trabalho", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Trabalho guardado", variant: "success" });
    startTransition(() => router.refresh());
    onSaved?.();
    if (backHref) router.push(backHref);
  }

  return (
    <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      <div className="space-y-1">
        <Label htmlFor="tp">Título PT *</Label>
        <Input id="tp" value={titlePt} onChange={(e) => setTitlePt(e.target.value)} required maxLength={200} disabled={saving} />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="te">Título EN</Label>
          <button
            type="button"
            onClick={() => setTitleEn(titlePt)}
            disabled={saving || !titlePt.trim()}
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
            title="Copiar título PT para EN"
          >
            <Copy className="h-3 w-3" aria-hidden="true" />
            PT → EN
          </button>
        </div>
        <Input id="te" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} maxLength={200} disabled={saving} />
      </div>

      <div className="space-y-2">
        <Label>Imagem</Label>
        <ImageUploadZone
          value={imageUrl ? [imageUrl] : []}
          onChange={(urls) => setImageUrl(urls[0] ?? "")}
          disabled={saving}
          max={1}
        />
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
