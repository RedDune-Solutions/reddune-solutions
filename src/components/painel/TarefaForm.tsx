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
  PROJETO_STATUS,
  PROJETO_TIPO,
  PROJETO_RESPONSAVEL,
  type Projeto,
  type ProjetoStatus,
  type ProjetoTipo,
  type ProjetoResponsavel,
} from "@/types/projeto";
import type { Cliente } from "@/types/cliente";

type Props = {
  projeto?: Projeto;
  clientes?: Cliente[];
  onSaved?: (id: string) => void;
  onCancel?: () => void;
};

export function TarefaForm({ projeto, clientes = [], onSaved, onCancel }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [titulo, setTitulo] = useState(projeto?.titulo ?? "");
  const [clienteId, setClienteId] = useState(projeto?.clienteId ?? "");
  const [status, setStatus] = useState<ProjetoStatus>(projeto?.status ?? "proximo");
  const [tipo, setTipo] = useState<ProjetoTipo | "">(projeto?.tipo ?? "");
  const [responsavel, setResponsavel] = useState<ProjetoResponsavel | "">(
    projeto?.responsavel ?? ""
  );
  const [prazo, setPrazo] = useState(projeto?.prazo ?? "");
  const [valorEstimado, setValorEstimado] = useState(
    projeto?.valorEstimado != null ? String(projeto.valorEstimado) : ""
  );
  const [proximaAccao, setProximaAccao] = useState(projeto?.proximaAccao ?? "");
  const [notasResumo, setNotasResumo] = useState(projeto?.notasResumo ?? "");

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

      const selectedCliente = clientes.find((c) => c.id === clienteId);

      const payload = {
        id: projeto?.id,
        titulo: titulo.trim(),
        clienteId: clienteId || null,
        clienteNome: selectedCliente?.nome ?? projeto?.clienteNome ?? null,
        status,
        tipo: tipo || null,
        responsavel: responsavel || null,
        prazo: prazo || null,
        valorEstimado: valor,
        proximaAccao: proximaAccao.trim() || null,
        notasResumo: notasResumo.trim() || null,
      };

      const res = await fetch("/api/projetos/upsert", {
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
          placeholder="Nome do projeto"
          disabled={isBusy}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Estado *</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ProjetoStatus)} disabled={isBusy}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROJETO_STATUS.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Tipo</Label>
          <Select
            value={tipo || "__none"}
            onValueChange={(v) => setTipo(v === "__none" ? "" : (v as ProjetoTipo))}
            disabled={isBusy}
          >
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">— Nenhum —</SelectItem>
              {PROJETO_TIPO.map((t) => (
                <SelectItem key={t} value={t}>{t.replace("-", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {clientes.length > 0 && (
        <div className="space-y-1">
          <Label>Cliente</Label>
          <Select
            value={clienteId || "__none"}
            onValueChange={(v) => setClienteId(v === "__none" ? "" : v)}
            disabled={isBusy}
          >
            <SelectTrigger><SelectValue placeholder="— Sem cliente —" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">— Sem cliente —</SelectItem>
              {clientes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Responsável</Label>
          <Select
            value={responsavel || "__none"}
            onValueChange={(v) =>
              setResponsavel(v === "__none" ? "" : (v as ProjetoResponsavel))
            }
            disabled={isBusy}
          >
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">— Nenhum —</SelectItem>
              {PROJETO_RESPONSAVEL.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
          {projeto ? "Guardar" : "Criar projeto"}
        </Button>
      </div>
    </form>
  );
}
