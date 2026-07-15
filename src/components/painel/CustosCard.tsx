"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Euro, Receipt } from "lucide-react";
import { LinhasEditor, computeTotal } from "./LinhasEditor";
import type { Projeto, ProjetoLinha } from "@/types/projeto";
import { DESPESA_CATEGORIA_LABEL, type Despesa } from "@/types/despesa";
import { parseMoney } from "@/lib/parse-number";
import { safeJsonPost } from "@/lib/safe-fetch";
import { useToast } from "@/hooks/use-toast";

type Props = {
  projeto: Projeto;
  /**
   * Despesas manuais ligadas a este projecto (ex.: renovação de domínio).
   * Somam ao chip "Gasto empresa" e são listadas por baixo das linhas —
   * registam-se/apagam-se nos Relatórios, aqui são só leitura.
   */
  despesas?: Despesa[];
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export function CustosCard({ projeto, despesas = [] }: Props) {
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

  const gastoDespesas = despesas.reduce((s, d) => s + d.valor, 0);

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
            ✓ = paguei do meu bolso
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
        <LinhasEditor
          linhas={linhas}
          onChange={setLinhas}
          disabled={saving}
          gastoDespesas={gastoDespesas}
        />
      )}

      {despesas.length > 0 && (
        <div className="psub">
          <p className="plabel">
            <Receipt className="ic" aria-hidden="true" />
            Despesas ligadas
            <Link
              className="link-more"
              href="/painel/relatorios?g=manual"
              style={{ marginLeft: "auto", textTransform: "none", letterSpacing: 0 }}
            >
              Gerir nos relatórios
            </Link>
          </p>
          {despesas.map((d) => (
            <div key={d.id} className="act">
              <span className="a-ic">
                <Receipt className="ic" aria-hidden="true" />
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="who truncate">{d.descricao}</div>
                <div className="muted truncate" style={{ fontSize: 11.5 }}>
                  {DESPESA_CATEGORIA_LABEL[d.categoria]} · {fmtDate(d.data)}
                </div>
              </div>
              <b
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: 13.5,
                  whiteSpace: "nowrap",
                }}
              >
                {d.valor.toLocaleString("pt-PT", { maximumFractionDigits: 2 })} €
              </b>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p style={{ fontSize: 12, color: "var(--ember)", margin: "10px 0 0" }}>{error}</p>
      )}
    </section>
  );
}
