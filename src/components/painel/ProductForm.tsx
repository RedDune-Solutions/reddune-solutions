"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product } from "@/types/product";
import { safeJsonPost } from "@/lib/safe-fetch";
import { useToast } from "@/hooks/use-toast";
import { ImageUploadZone } from "./ImageUploadZone";

type Props = {
  product: Product | null;
  onSaved?: () => void;
  onCancel?: () => void;
  /** Se definido, redireciona para este caminho após guardar com sucesso. */
  backHref?: string;
};

const CONDITION_OPTIONS = [
  { pt: "novo", en: "new" },
  { pt: "recondicionado", en: "refurbished" },
  { pt: "segunda mão", en: "second-hand" },
];

export function ProductForm({ product, onSaved, onCancel, backHref }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [namePt, setNamePt] = useState(product?.name.pt ?? "");
  const [nameEn, setNameEn] = useState(product?.name.en ?? "");
  const [descPt, setDescPt] = useState(product?.description.pt ?? "");
  const [descEn, setDescEn] = useState(product?.description.en ?? "");
  const [catPt, setCatPt] = useState(product?.category.pt ?? "");
  const [catEn, setCatEn] = useState(product?.category.en ?? "");
  const [condPt, setCondPt] = useState(product?.condition.pt ?? "novo");
  const [price, setPrice] = useState(product?.price != null ? String(product.price) : "");
  const [images, setImages] = useState<string[]>(product?.imageUrls ?? []);
  const [available, setAvailable] = useState(product?.available ?? true);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!namePt.trim()) {
      setError("Nome PT obrigatório.");
      return;
    }
    setSaving(true);
    setError(null);

    const condEn = CONDITION_OPTIONS.find((c) => c.pt === condPt)?.en ?? "new";

    const res = await safeJsonPost("/api/products/upsert", {
      id: product?.id,
      name: { pt: namePt.trim(), en: nameEn.trim() || namePt.trim() },
      description: { pt: descPt.trim(), en: descEn.trim() },
      category: { pt: catPt.trim() || "outro", en: catEn.trim() || "other" },
      condition: { pt: condPt, en: condEn },
      price: Number(price.replace(",", ".")) || 0,
      imageUrls: images,
      available,
      featured,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      toast({ title: "Erro a guardar produto", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Produto guardado", variant: "success" });
    startTransition(() => router.refresh());
    onSaved?.();
    if (backHref) router.push(backHref);
  }

  return (
    <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="np">Nome PT *</Label>
          <Input id="np" value={namePt} onChange={(e) => setNamePt(e.target.value)} required maxLength={200} disabled={saving} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="ne">Nome EN</Label>
            <button
              type="button"
              onClick={() => setNameEn(namePt)}
              disabled={saving || !namePt.trim()}
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
              title="Copiar nome PT para EN"
            >
              <Copy className="h-3 w-3" aria-hidden="true" />
              PT → EN
            </button>
          </div>
          <Input id="ne" value={nameEn} onChange={(e) => setNameEn(e.target.value)} maxLength={200} disabled={saving} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="dp">Descrição PT</Label>
          <Textarea id="dp" value={descPt} onChange={(e) => setDescPt(e.target.value)} rows={3} disabled={saving} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="de">Descrição EN</Label>
            <button
              type="button"
              onClick={() => setDescEn(descPt)}
              disabled={saving || !descPt.trim()}
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
              title="Copiar descrição PT para EN"
            >
              <Copy className="h-3 w-3" aria-hidden="true" />
              PT → EN
            </button>
          </div>
          <Textarea id="de" value={descEn} onChange={(e) => setDescEn(e.target.value)} rows={3} disabled={saving} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="cp">Categoria PT</Label>
          <Input id="cp" value={catPt} onChange={(e) => setCatPt(e.target.value)} placeholder="ex: portátil" disabled={saving} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="ce">Categoria EN</Label>
            <button
              type="button"
              onClick={() => setCatEn(catPt)}
              disabled={saving || !catPt.trim()}
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
              title="Copiar categoria PT para EN"
            >
              <Copy className="h-3 w-3" aria-hidden="true" />
              PT → EN
            </button>
          </div>
          <Input id="ce" value={catEn} onChange={(e) => setCatEn(e.target.value)} placeholder="ex: laptop" disabled={saving} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Condição</Label>
          <Select value={condPt} onValueChange={setCondPt} disabled={saving}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CONDITION_OPTIONS.map((c) => (
                <SelectItem key={c.pt} value={c.pt}>
                  {c.pt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="pr">Preço (€)</Label>
          <Input
            id="pr"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0,00"
            disabled={saving}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Imagens</Label>
        <ImageUploadZone value={images} onChange={setImages} disabled={saving} />
      </div>

      <div className="flex items-center gap-4 pt-2">
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
            disabled={saving}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          Disponível
        </label>
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            disabled={saving}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          Destaque
        </label>
      </div>

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
          {product ? "Guardar" : "Criar produto"}
        </Button>
      </div>
    </form>
  );
}
