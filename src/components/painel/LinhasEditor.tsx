"use client";

import { useRef } from "react";
import { Plus, Trash2, Copy, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  LINHA_CATEGORIA,
  LINHA_CATEGORIA_LABEL,
  computeGastoEmpresa,
  type LinhaCategoria,
  type ProjetoLinha,
} from "@/types/projeto";
import { parseMoney, parseQty } from "@/lib/parse-number";

type Props = {
  linhas: ProjetoLinha[];
  onChange: (linhas: ProjetoLinha[]) => void;
  disabled?: boolean;
};

/** Classe .lcat.cat-* do protótipo por categoria. */
const CAT_CLASS: Record<LinhaCategoria, string> = {
  peca: "cat-peca",
  "mao-obra": "cat-mao",
  outro: "cat-outro",
};

/** Cores inline dos chips de total por categoria (protótipo, linha 647). */
const CAT_CHIP_STYLE: Record<LinhaCategoria, React.CSSProperties> = {
  peca: { background: "rgba(224,122,63,.10)", color: "#c2560e" },
  "mao-obra": { background: "rgba(56,132,255,.08)", color: "#2563a8" },
  outro: { background: "rgba(90,14,14,.05)", color: "var(--ink-soft)" },
};

function newLinhaId(): string {
  return `l_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Data LOCAL de hoje (yyyy-mm-dd). Nunca toISOString: à meia-noite local
// deslocaria para o dia anterior em UTC.
function hojeIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function computeTotal(linhas: ProjetoLinha[]): number {
  return linhas.reduce((sum, l) => sum + l.quantidade * l.precoUnit, 0);
}

export function computeByCategoria(linhas: ProjetoLinha[]): Record<LinhaCategoria, number> {
  const acc: Record<LinhaCategoria, number> = { peca: 0, "mao-obra": 0, outro: 0 };
  for (const l of linhas) {
    acc[l.categoria] += l.quantidade * l.precoUnit;
  }
  return acc;
}

export function LinhasEditor({ linhas, onChange, disabled }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  function updateLinha(id: string, patch: Partial<ProjetoLinha>) {
    onChange(linhas.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function removeLinha(id: string) {
    onChange(linhas.filter((l) => l.id !== id));
  }

  function duplicateLinha(l: ProjetoLinha) {
    const idx = linhas.findIndex((x) => x.id === l.id);
    const copy: ProjetoLinha = { ...l, id: newLinhaId() };
    if (idx < 0) {
      onChange([...linhas, copy]);
    } else {
      const next = [...linhas];
      next.splice(idx + 1, 0, copy);
      onChange(next);
    }
  }

  function addLinha() {
    onChange([
      ...linhas,
      {
        id: newLinhaId(),
        descricao: "",
        categoria: "peca",
        quantidade: 1,
        precoUnit: 0,
      },
    ]);
    setTimeout(() => {
      const last = listRef.current?.lastElementChild;
      last?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }

  const total = computeTotal(linhas);
  const totals = computeByCategoria(linhas);
  const gasto = computeGastoEmpresa(linhas);

  return (
    <div>
      {linhas.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--ink-mute)", fontStyle: "italic", margin: "0 0 8px" }}>
          Sem linhas. Adiciona peças, mão-de-obra ou outros custos para calcular o valor.
        </p>
      ) : (
        <div ref={listRef}>
          {linhas.map((l) => {
            const subtotal = l.quantidade * l.precoUnit;
            return (
              <div key={l.id} className="lrow">
                <input
                  className="in-sm ldesc"
                  placeholder="Descrição"
                  value={l.descricao}
                  onChange={(e) => updateLinha(l.id, { descricao: e.target.value })}
                  disabled={disabled}
                  maxLength={300}
                />
                <select
                  className={cn("lcat", CAT_CLASS[l.categoria])}
                  value={l.categoria}
                  onChange={(e) => updateLinha(l.id, { categoria: e.target.value as LinhaCategoria })}
                  disabled={disabled}
                  aria-label="Categoria"
                >
                  {LINHA_CATEGORIA.map((c) => (
                    <option key={c} value={c}>
                      {LINHA_CATEGORIA_LABEL[c]}
                    </option>
                  ))}
                </select>
                <input
                  className="in-sm qtd"
                  type="number"
                  inputMode="numeric"
                  step="1"
                  min="0"
                  placeholder="Qtd"
                  value={l.quantidade}
                  onChange={(e) => updateLinha(l.id, { quantidade: parseQty(e.target.value) })}
                  disabled={disabled}
                  aria-label="Quantidade"
                />
                <input
                  className="in-sm lpreco"
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0"
                  placeholder="€"
                  value={l.precoUnit}
                  onChange={(e) => updateLinha(l.id, { precoUnit: parseMoney(e.target.value) ?? 0 })}
                  disabled={disabled}
                  aria-label="Preço unitário"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="icon-mini lmenu"
                      disabled={disabled}
                      title="Acções da linha"
                      aria-label="Acções da linha"
                    >
                      <MoreVertical aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => duplicateLinha(l)}>
                      <Copy style={{ width: 13, height: 13, marginRight: 6 }} aria-hidden="true" />
                      Duplicar linha
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => removeLinha(l.id)}
                      style={{ color: "var(--ember)" }}
                    >
                      <Trash2 style={{ width: 13, height: 13, marginRight: 6 }} aria-hidden="true" />
                      Remover linha
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Sub-linha fixa: gasto da empresa (com label visível), data
                    do gasto (regime de caixa) e subtotal. */}
                <div className="ldata">
                  <label className="lgasto">
                    <input
                      type="checkbox"
                      className="lchk"
                      checked={!!l.gastoEmpresa}
                      onChange={(e) =>
                        updateLinha(l.id, {
                          gastoEmpresa: e.target.checked,
                          // Ao marcar, pré-preenche com hoje (regime de caixa:
                          // normalmente compras quando registas). Editável.
                          ...(e.target.checked && !l.data ? { data: hojeIso() } : {}),
                        })
                      }
                      disabled={disabled}
                    />
                    Gasto da empresa
                  </label>
                  {l.gastoEmpresa && (
                    <input
                      className="in-sm"
                      type="date"
                      value={l.data ?? ""}
                      onChange={(e) => updateLinha(l.id, { data: e.target.value || null })}
                      disabled={disabled}
                      title="Data em que pagaste (vazio = conta no mês do projecto)"
                      aria-label="Data do gasto"
                    />
                  )}
                  <span className="lsub">{subtotal.toFixed(2)}€</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rodapé: adicionar linha + totais */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
          marginTop: 4,
        }}
      >
        <button type="button" className="btn-ghost" onClick={addLinha} disabled={disabled}>
          <Plus style={{ width: 13, height: 13 }} aria-hidden="true" />
          Adicionar linha
        </button>

        {linhas.length > 0 && (
          <div className="ltot">
            {gasto > 0 && (
              <span
                className="tchip-gasto"
                title="Soma das linhas marcadas como gasto da empresa"
              >
                Gasto empresa: {gasto.toFixed(2)}€
              </span>
            )}
            {(["peca", "mao-obra", "outro"] as LinhaCategoria[]).map((c) =>
              totals[c] > 0 ? (
                <span key={c} className="tchip-cat" style={CAT_CHIP_STYLE[c]}>
                  {LINHA_CATEGORIA_LABEL[c]}: {totals[c].toFixed(2)}€
                </span>
              ) : null
            )}
            <b style={{ fontSize: 14, color: "var(--ink)" }}>Total: {total.toFixed(2)}€</b>
          </div>
        )}
      </div>
    </div>
  );
}
