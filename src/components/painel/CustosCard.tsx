"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Euro } from "lucide-react";
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
    <section className="card">
      {/* Cabeçalho: label + hint + Guardar custos */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div className="card-label" style={{ margin: 0 }}>
          <Euro className="ic" aria-hidden="true" />
          Custos
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--ink-mute)",
              letterSpacing: ".04em",
              textTransform: "none",
            }}
          >
            ✓ = gasto da empresa
          </span>
        </div>
        {dirty && (
          <button type="button" className="btn-ghost" onClick={save} disabled={saving}>
            {saving && (
              <Loader2 className="animate-spin" style={{ width: 13, height: 13 }} aria-hidden="true" />
            )}
            Guardar custos
          </button>
        )}
      </div>

      {useLegacy ? (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexWrap: "wrap" }}>
          <div className="field" style={{ marginBottom: 0, width: 180 }}>
            <label htmlFor="vl">Valor estimado (€)</label>
            <input
              id="vl"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={valorLegacy}
              onChange={(e) => setValorLegacy(e.target.value)}
              disabled={saving}
            />
          </div>
          <button
            type="button"
            className="btn-ghost"
            onClick={convertLegacy}
            disabled={saving}
            style={{ marginBottom: 4 }}
          >
            Converter em linhas
          </button>
        </div>
      ) : (
        <LinhasEditor linhas={linhas} onChange={setLinhas} disabled={saving} />
      )}

      {error && (
        <p style={{ fontSize: 12, color: "var(--ember)", margin: "10px 0 0" }}>{error}</p>
      )}
    </section>
  );
}
