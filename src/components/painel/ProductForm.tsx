"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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

type Props = {
  product: Product | null;
  onSaved?: () => void;
  onCancel?: () => void;
};

const CONDITION_OPTIONS = [
  { pt: "novo", en: "new" },
  { pt: "recondicionado", en: "refurbished" },
  { pt: "segunda mão", en: "second-hand" },
];

export function ProductForm({ product, onSaved, onCancel }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [namePt, setNamePt] = useState(product?.name.pt ?? "");
  const [nameEn, setNameEn] = useState(product?.name.en ?? "");
  const [descPt, setDescPt] = useState(product?.description.pt ?? "");
  const [descEn, setDescEn] = useState(product?.description.en ?? "");
  const [catPt, setCatPt] = useState(product?.category.pt ?? "");
  const [catEn, setCatEn] = useState(product?.category.en ?? "");
  const [condPt, setCondPt] = useState(product?.condition.pt ?? "novo");
  const [price, setPrice] = useState(product?.price != null ? String(product.price) : "");
  const [imageUrls, setImageUrls] = useState((product?.imageUrls ?? []).join("\n"));
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
    const urls = imageUrls
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/products/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product?.id,
          name: { pt: namePt.trim(), en: nameEn.trim() || namePt.trim() },
          description: { pt: descPt.trim(), en: descEn.trim() },
          category: { pt: catPt.trim() || "outro", en: catEn.trim() || "other" },
          condition: { pt: condPt, en: condEn },
          price: Number(price.replace(",", ".")) || 0,
          imageUrls: urls,
          available,
          featured,
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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="np">Nome PT *</Label>
          <Input id="np" value={namePt} onChange={(e) => setNamePt(e.target.value)} required maxLength={200} disabled={saving} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ne">Nome EN</Label>
          <Input id="ne" value={nameEn} onChange={(e) => setNameEn(e.target.value)} maxLength={200} disabled={saving} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="dp">Descrição PT</Label>
          <Textarea id="dp" value={descPt} onChange={(e) => setDescPt(e.target.value)} rows={3} disabled={saving} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="de">Descrição EN</Label>
          <Textarea id="de" value={descEn} onChange={(e) => setDescEn(e.target.value)} rows={3} disabled={saving} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="cp">Categoria PT</Label>
          <Input id="cp" value={catPt} onChange={(e) => setCatPt(e.target.value)} placeholder="ex: portátil" disabled={saving} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ce">Categoria EN</Label>
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

      <div className="space-y-1">
        <Label htmlFor="imgs">URLs de imagens (uma por linha)</Label>
        <Textarea
          id="imgs"
          value={imageUrls}
          onChange={(e) => setImageUrls(e.target.value)}
          rows={3}
          placeholder="https://..."
          disabled={saving}
          className="font-mono text-xs"
        />
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
