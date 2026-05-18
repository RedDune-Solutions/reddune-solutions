"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Euro } from "lucide-react";
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
import { METODO_PAGAMENTO, METODO_LABEL, type Pagamento, type MetodoPagamento } from "@/types/pagamento";

type Props = {
  projetoId: string;
  pagamentos: Pagamento[];
  valorEstimado?: number | null;
  projetoStatus?: string;
  projetoTitulo?: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export function PagamentosSection({ projetoId, pagamentos, valorEstimado, projetoStatus, projetoTitulo }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [valor, setValor] = useState("");
  const [data, setData] = useState(todayIso());
  const [metodo, setMetodo] = useState<MetodoPagamento | "">("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPago = pagamentos.reduce((s, p) => s + p.valor, 0);
  const emDivida = valorEstimado != null ? valorEstimado - totalPago : null;
  const canClose = projetoStatus === "terminado" && emDivida != null && emDivida <= 0;

  async function fecharProjeto() {
    if (!projetoTitulo) return;
    await fetch("/api/projetos/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: projetoId, titulo: projetoTitulo, status: "fechado" }),
    });
    startTransition(() => router.refresh());
  }

  function reset() {
    setValor("");
    setData(todayIso());
    setMetodo("");
    setNotas("");
    setError(null);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const v = parseFloat(valor);
    if (!Number.isFinite(v) || v <= 0) {
      setError("Valor inválido.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/pagamentos/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projetoId,
          valor: v,
          data,
          metodo: metodo || null,
          notas: notas.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? `HTTP ${res.status}`);
        return;
      }
      reset();
      setAdding(false);
      startTransition(() => router.refresh());
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Apagar pagamento?")) return;
    await fetch(`/api/pagamentos/${encodeURIComponent(id)}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Euro className="h-3.5 w-3.5" aria-hidden="true" />
          Pagamentos
        </p>
        {!adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
            Adicionar
          </Button>
        )}
      </div>

      {/* Totais */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="font-mono tabular-nums">
          Pago: <strong>{totalPago}€</strong>
        </span>
        {valorEstimado != null && (
          <>
            <span className="font-mono tabular-nums text-muted-foreground">
              Total: {valorEstimado}€
            </span>
            {emDivida != null && emDivida > 0 && (
              <span className="font-mono tabular-nums text-rose-600 font-semibold">
                Em dívida: {emDivida}€
              </span>
            )}
            {emDivida != null && emDivida <= 0 && (
              <span className="font-mono tabular-nums text-emerald-600 font-semibold">
                Liquidado
              </span>
            )}
          </>
        )}
        {canClose && (
          <Button size="sm" variant="outline" onClick={fecharProjeto} className="ml-auto">
            Marcar como fechado
          </Button>
        )}
      </div>

      {adding && (
        <form onSubmit={add} className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="pv">Valor €</Label>
              <Input
                id="pv"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                disabled={saving}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pd">Data</Label>
              <Input
                id="pd"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                disabled={saving}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Método</Label>
              <Select
                value={metodo || "__none"}
                onValueChange={(v) => setMetodo(v === "__none" ? "" : (v as MetodoPagamento))}
                disabled={saving}
              >
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">—</SelectItem>
                  {METODO_PAGAMENTO.map((m) => (
                    <SelectItem key={m} value={m}>{METODO_LABEL[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="pn">Observações</Label>
            <Textarea
              id="pn"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              maxLength={2000}
              disabled={saving}
            />
          </div>
          {error && (
            <p className="text-xs text-rose-600 bg-rose-500/10 border border-rose-500/20 rounded px-2 py-1">
              {error}
            </p>
          )}
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setAdding(false); reset(); }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" aria-hidden="true" />}
              Registar
            </Button>
          </div>
        </form>
      )}

      {pagamentos.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Sem pagamentos registados.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border bg-background">
          {pagamentos.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="font-mono tabular-nums font-semibold w-20">{p.valor}€</span>
              <span className="text-muted-foreground tabular-nums w-28">{fmtDate(p.data)}</span>
              {p.metodo && (
                <span className="text-xs rounded bg-muted px-1.5 py-0.5">
                  {METODO_LABEL[p.metodo]}
                </span>
              )}
              {p.notas && (
                <span className="text-xs text-muted-foreground truncate flex-1">{p.notas}</span>
              )}
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="ml-auto text-muted-foreground hover:text-destructive p-1 rounded"
                aria-label="Apagar pagamento"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
