"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  LINHA_CATEGORIA,
  LINHA_CATEGORIA_LABEL,
  type LinhaCategoria,
  type ProjetoLinha,
} from "@/types/projeto";

type Props = {
  linhas: ProjetoLinha[];
  onChange: (linhas: ProjetoLinha[]) => void;
  disabled?: boolean;
};

const CATEGORIA_COLOR: Record<LinhaCategoria, string> = {
  peca: "bg-orange-500/10 text-orange-700 border-orange-500/30",
  "mao-obra": "bg-sky-500/10 text-sky-700 border-sky-500/30",
  outro: "bg-slate-500/10 text-slate-700 border-slate-500/30",
};

function newLinhaId(): string {
  return `l_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
  function updateLinha(id: string, patch: Partial<ProjetoLinha>) {
    onChange(linhas.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function removeLinha(id: string) {
    onChange(linhas.filter((l) => l.id !== id));
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
  }

  const total = computeTotal(linhas);
  const totals = computeByCategoria(linhas);

  return (
    <div className="space-y-3">
      {linhas.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          Sem linhas. Adiciona peças, mão-de-obra ou outros custos para calcular o valor.
        </p>
      ) : (
        <div className="space-y-2">
          {linhas.map((l) => {
            const subtotal = l.quantidade * l.precoUnit;
            return (
              <div
                key={l.id}
                className="grid grid-cols-12 gap-2 items-center rounded-md border border-border bg-card p-2"
              >
                <Input
                  placeholder="Descrição"
                  value={l.descricao}
                  onChange={(e) => updateLinha(l.id, { descricao: e.target.value })}
                  disabled={disabled}
                  maxLength={300}
                  className="col-span-5 h-8 text-xs"
                />
                <Select
                  value={l.categoria}
                  onValueChange={(v) => updateLinha(l.id, { categoria: v as LinhaCategoria })}
                  disabled={disabled}
                >
                  <SelectTrigger className={cn("col-span-2 h-8 text-xs border", CATEGORIA_COLOR[l.categoria])}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LINHA_CATEGORIA.map((c) => (
                      <SelectItem key={c} value={c}>
                        {LINHA_CATEGORIA_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  inputMode="numeric"
                  step="1"
                  min="0"
                  placeholder="Qtd"
                  value={l.quantidade}
                  onChange={(e) =>
                    updateLinha(l.id, { quantidade: parseInt(e.target.value, 10) || 0 })
                  }
                  disabled={disabled}
                  className="col-span-1 h-8 text-xs tabular-nums"
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="€"
                  value={l.precoUnit}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const n = raw === "" ? 0 : parseFloat(raw);
                    updateLinha(l.id, { precoUnit: Number.isFinite(n) ? n : 0 });
                  }}
                  disabled={disabled}
                  className="col-span-2 h-8 text-xs tabular-nums"
                />
                <div className="col-span-1 text-right font-mono text-xs tabular-nums font-semibold">
                  {subtotal.toFixed(2)}€
                </div>
                <button
                  type="button"
                  onClick={() => removeLinha(l.id)}
                  disabled={disabled}
                  aria-label="Remover linha"
                  className="col-span-1 justify-self-end text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLinha}
          disabled={disabled}
          className="h-8 text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
          Adicionar linha
        </Button>

        {linhas.length > 0 && (
          <div className="flex items-center gap-3 text-xs">
            {(["peca", "mao-obra", "outro"] as LinhaCategoria[]).map((c) =>
              totals[c] > 0 ? (
                <span
                  key={c}
                  className={cn(
                    "rounded px-2 py-0.5 font-mono tabular-nums",
                    CATEGORIA_COLOR[c]
                  )}
                >
                  {LINHA_CATEGORIA_LABEL[c]}: {totals[c].toFixed(2)}€
                </span>
              ) : null
            )}
            <span className="font-mono tabular-nums text-base font-bold text-foreground">
              Total: {total.toFixed(2)}€
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
