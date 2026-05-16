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
import {
  STATUS_LABELS,
  TAREFA_STATUS,
  TAREFA_TIPO,
  TAREFA_RESPONSAVEL,
  TAREFA_PASTA,
  type TarefaPublic,
  type TarefaStatus,
  type TarefaTipo,
  type TarefaResponsavel,
  type TarefaPasta,
} from "@/types/tarefa";

type Props = {
  tarefa?: TarefaPublic;
  onSaved?: (id: string) => void;
  onCancel?: () => void;
};

export function TarefaForm({ tarefa, onSaved, onCancel }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [titulo, setTitulo] = useState(tarefa?.titulo ?? "");
  const [cliente, setCliente] = useState(tarefa?.cliente ?? "");
  const [status, setStatus] = useState<TarefaStatus>(tarefa?.status ?? "proximo");
  const [tipo, setTipo] = useState<TarefaTipo | "">(tarefa?.tipo ?? "");
  const [responsavel, setResponsavel] = useState<TarefaResponsavel | "">(
    tarefa?.responsavel ?? ""
  );
  const [pasta, setPasta] = useState<TarefaPasta>(tarefa?.pasta ?? "clientes");
  const [prazo, setPrazo] = useState(tarefa?.prazo ?? "");
  const [valorEstimado, setValorEstimado] = useState(
    tarefa?.valorEstimado != null ? String(tarefa.valorEstimado) : ""
  );
  const [proximaAccao, setProximaAccao] = useState(tarefa?.proximaAccao ?? "");
  const [notasResumo, setNotasResumo] = useState(tarefa?.notasResumo ?? "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const valor = valorEstimado.trim()
        ? Number(valorEstimado.replace(",", "."))
        : null;
      if (valor !== null && !Number.isFinite(valor)) {
        setError("Valor estimado inválido.");
        setSubmitting(false);
        return;
      }

      const payload = {
        id: tarefa?.id,
        titulo: titulo.trim(),
        cliente: cliente.trim() || null,
        status,
        tipo: tipo || null,
        responsavel: responsavel || null,
        pasta,
        prazo: prazo || null,
        valorEstimado: valor,
        proximaAccao: proximaAccao.trim() || null,
        notasResumo: notasResumo.trim() || null,
      };

      const res = await fetch("/api/tarefas/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `HTTP ${res.status}`);
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      startTransition(() => router.refresh());
      onSaved?.(data.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const isBusy = submitting || pending;

  return (
    <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      <div className="space-y-1">
        <Label htmlFor="titulo">Título *</Label>
        <Input
          id="titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
          maxLength={300}
          placeholder="Nome do projecto ou tarefa"
          disabled={isBusy}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Estado *</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as TarefaStatus)} disabled={isBusy}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TAREFA_STATUS.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Pasta *</Label>
          <Select value={pasta} onValueChange={(v) => setPasta(v as TarefaPasta)} disabled={isBusy}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TAREFA_PASTA.map((p) => (
                <SelectItem key={p} value={p}>{p === "clientes" ? "Clientes" : "Internos"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="cliente">Cliente</Label>
        <Input
          id="cliente"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          maxLength={300}
          placeholder="Nome do cliente"
          disabled={isBusy}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Tipo</Label>
          <Select
            value={tipo || "__none"}
            onValueChange={(v) => setTipo(v === "__none" ? "" : (v as TarefaTipo))}
            disabled={isBusy}
          >
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">— Nenhum —</SelectItem>
              {TAREFA_TIPO.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Responsável</Label>
          <Select
            value={responsavel || "__none"}
            onValueChange={(v) =>
              setResponsavel(v === "__none" ? "" : (v as TarefaResponsavel))
            }
            disabled={isBusy}
          >
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">— Nenhum —</SelectItem>
              {TAREFA_RESPONSAVEL.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="prazo">Prazo</Label>
          <Input
            id="prazo"
            type="date"
            value={prazo ?? ""}
            onChange={(e) => setPrazo(e.target.value)}
            disabled={isBusy}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="valor">Valor estimado (€)</Label>
          <Input
            id="valor"
            inputMode="decimal"
            value={valorEstimado}
            onChange={(e) => setValorEstimado(e.target.value)}
            placeholder="0,00"
            disabled={isBusy}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="proximaAccao">Próxima acção</Label>
        <Input
          id="proximaAccao"
          value={proximaAccao}
          onChange={(e) => setProximaAccao(e.target.value)}
          maxLength={500}
          placeholder="O que falta fazer a seguir"
          disabled={isBusy}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="notas">Notas</Label>
        <Textarea
          id="notas"
          value={notasResumo}
          onChange={(e) => setNotasResumo(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Detalhes adicionais"
          disabled={isBusy}
        />
      </div>

      {error && (
        <p role="alert" className="text-xs text-dune bg-dune/10 px-3 py-2 rounded-btn border border-dune/20">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isBusy}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isBusy} className="bg-ink text-cream hover:bg-ember">
          {isBusy && <Loader2 className="h-4 w-4 mr-1 animate-spin" aria-hidden="true" />}
          {tarefa ? "Guardar" : "Criar tarefa"}
        </Button>
      </div>
    </form>
  );
}
