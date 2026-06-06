"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinhasEditor, computeTotal } from "./LinhasEditor";
import type { Projeto, ProjetoLinha } from "@/types/projeto";
import { parseMoney } from "@/lib/parse-number";
import { safeJsonPost } from "@/lib/safe-fetch";
import { useToast } from "@/hooks/use-toast";

type Props = {
  projeto: Projeto;
};

export function CustosCard({ projeto }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const initial: ProjetoLinha[] = projeto.linhas ?? [];
  const [linhas, setLinhas] = useState<ProjetoLinha[]>(initial);
  const [valorLegacy, setValorLegacy] = useState(
    projeto.valorEstimado != null ? String(projeto.valorEstimado) : ""
  );
  const hasLegacy = projeto.linhas == null && projeto.valorEstimado != null;
  const [useLegacy, setUseLegacy] = useState(hasLegacy);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = useLegacy
    ? valorLegacy.trim() !== (projeto.valorEstimado != null ? String(projeto.valorEstimado) : "")
    : JSON.stringify(linhas) !== JSON.stringify(initial);

  function convertLegacy() {
    const v = parseMoney(valorLegacy) ?? NaN;
    if (Number.isFinite(v) && v > 0) {
      setLinhas([
        {
          id: `l_${Date.now()}`,
          descricao: "Valor estimado",
          categoria: "outro",
          quantidade: 1,
          precoUnit: v,
        },
      ]);
    }
    setUseLegacy(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    let payload: Record<string, unknown>;
    if (useLegacy) {
      const v = valorLegacy.trim() ? parseMoney(valorLegacy) : null;
      if (valorLegacy.trim() && v === null) {
        setError("Valor inválido.");
        setSaving(false);
        return;
      }
      payload = { id: projeto.id, titulo: projeto.titulo, status: projeto.status, valorEstimado: v, linhas: null };
    } else {
      payload = {
        id: projeto.id,
        titulo: projeto.titulo,
        status: projeto.status,
        linhas,
        valorEstimado: computeTotal(linhas),
      };
    }
    const res = await safeJsonPost("/api/projetos/upsert", payload);
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      toast({ title: "Erro a guardar custos", description: res.error, variant: "destructive" });
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <section className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Euro className="h-3.5 w-3.5" aria-hidden="true" />
          Custos
        </p>
        {dirty && (
          <Button size="sm" onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" aria-hidden="true" />}
            Guardar custos
          </Button>
        )}
      </div>

      {useLegacy ? (
        <div className="space-y-2">
          <Label htmlFor="vl">Valor estimado (€)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="vl"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={valorLegacy}
              onChange={(e) => setValorLegacy(e.target.value)}
              disabled={saving}
              className="max-w-[180px]"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={convertLegacy}
              disabled={saving}
            >
              Converter em linhas
            </Button>
          </div>
        </div>
      ) : (
        <LinhasEditor linhas={linhas} onChange={setLinhas} disabled={saving} />
      )}

      {error && (
        <p className="text-xs text-rose-600 bg-rose-500/10 border border-rose-500/20 rounded px-2 py-1">
          {error}
        </p>
      )}
    </section>
  );
}
