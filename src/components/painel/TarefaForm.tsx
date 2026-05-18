"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import type { TarefaTemplate } from "@/types/tarefa-template";
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
  PROJETO_TIPO_LABEL,
  PROJETO_RESPONSAVEL,
  CATEGORIA_TIPOS,
  TIPO_TO_CATEGORIA,
  type Projeto,
  type ProjetoStatus,
  type ProjetoTipo,
  type ProjetoResponsavel,
} from "@/types/projeto";
import { SERVICO_SLUG_LABEL, type ServicoSlug } from "@/types/servico";
import type { Cliente } from "@/types/cliente";
import { ClienteQuickForm } from "./ClienteQuickForm";

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
  const [clientesList, setClientesList] = useState<Cliente[]>(clientes);
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [status, setStatus] = useState<ProjetoStatus>(projeto?.status ?? "proximo");
  const [tipos, setTipos] = useState<ProjetoTipo[]>(
    projeto?.tipos && projeto.tipos.length > 0
      ? projeto.tipos
      : projeto?.tipo
        ? [projeto.tipo]
        : []
  );
  const [categoria, setCategoria] = useState<ServicoSlug | null>(projeto?.categoria ?? null);
  const [responsavel, setResponsavel] = useState<ProjetoResponsavel | "">(
    projeto?.responsavel ?? ""
  );
  const [prazo, setPrazo] = useState(projeto?.prazo ?? "");
  const [garantiaAte, setGarantiaAte] = useState(projeto?.garantiaAte ?? "");
  const [proximaAccao, setProximaAccao] = useState(projeto?.proximaAccao ?? "");
  const [notasResumo, setNotasResumo] = useState(projeto?.notasResumo ?? "");
  const [templates, setTemplates] = useState<TarefaTemplate[]>([]);
  const [applyTemplateId, setApplyTemplateId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tarefa-templates")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: TarefaTemplate[] | unknown) => {
        if (!cancelled && Array.isArray(data)) setTemplates(data as TarefaTemplate[]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function onApplyTemplate(id: string) {
    setApplyTemplateId(id);
    if (!id) return;
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    if (t.categoria) setCategoria(t.categoria);
    if (t.tipos && t.tipos.length > 0) {
      setTipos((prev) => {
        const set = new Set(prev);
        for (const tp of t.tipos) set.add(tp);
        return Array.from(set);
      });
    }
  }

  function handleClienteCreated(c: Cliente) {
    setClientesList((prev) => [...prev, c]);
    setClienteId(c.id);
    setShowQuickClient(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const selectedCliente = clientesList.find((c) => c.id === clienteId);
      const showGarantia = status === "terminado" || status === "fechado";

      const payload = {
        id: projeto?.id,
        titulo: titulo.trim(),
        clienteId: clienteId || null,
        clienteNome: selectedCliente?.nome ?? projeto?.clienteNome ?? null,
        status,
        categoria: categoria,
        tipo: tipos.length > 0 ? tipos[0] : null,
        tipos: tipos.length > 0 ? tipos : null,
        responsavel: responsavel || null,
        prazo: prazo || null,
        proximaAccao: proximaAccao.trim() || null,
        notasResumo: notasResumo.trim() || null,
        garantiaAte: showGarantia ? (garantiaAte || null) : null,
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

      if (applyTemplateId && data?.id) {
        try {
          await fetch("/api/tarefas/from-template", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projetoId: data.id, templateId: applyTemplateId }),
          });
        } catch {
          // não bloquear o save principal
        }
        setApplyTemplateId("");
      }

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
      {/* Título + Template picker inline */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="titulo">Título *</Label>
          {templates.length > 0 && (
            <Select
              value={applyTemplateId || "__none"}
              onValueChange={(v) => onApplyTemplate(v === "__none" ? "" : v)}
              disabled={isBusy}
            >
              <SelectTrigger className="h-7 w-auto max-w-[200px] text-[11px] text-muted-foreground border-dashed">
                <SelectValue placeholder="Aplicar template…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— Sem template —</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.nome} ({t.itens?.length ?? 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Input
          id="titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
          maxLength={300}
          placeholder="Nome do projeto"
          disabled={isBusy}
        />
        {applyTemplateId && (
          <p className="text-[10px] text-muted-foreground">
            Tarefas do template serão criadas ao guardar.
          </p>
        )}
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
      </div>

      {/* Tipos — chips compactos em linha única por categoria */}
      <div className="space-y-1.5">
        <Label>Serviço / Tipo</Label>
        <div className="rounded-md border border-border bg-muted/30 p-2.5 space-y-2">
          {(Object.keys(CATEGORIA_TIPOS) as ServicoSlug[]).map((cat) => (
            <div key={cat} className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground w-24 shrink-0">
                {SERVICO_SLUG_LABEL[cat]}
              </span>
              {CATEGORIA_TIPOS[cat].map((t) => {
                const active = tipos.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={isBusy}
                    onClick={() => {
                      setTipos((prev) => {
                        const next = active ? prev.filter((x) => x !== t) : [...prev, t];
                        if (!categoria && !active) {
                          const auto = TIPO_TO_CATEGORIA[t];
                          if (auto) setCategoria(auto);
                        }
                        return next;
                      });
                    }}
                    className={
                      "text-[11px] px-2 py-0.5 rounded-full border transition-colors " +
                      (active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground")
                    }
                  >
                    {PROJETO_TIPO_LABEL[t]}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Cliente + Prazo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 col-span-2">
          <div className="flex items-center justify-between">
            <Label>Cliente</Label>
            {!showQuickClient && (
              <button
                type="button"
                onClick={() => setShowQuickClient(true)}
                disabled={isBusy}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <UserPlus className="h-3 w-3" aria-hidden="true" />
                Criar novo
              </button>
            )}
          </div>
          {showQuickClient ? (
            <ClienteQuickForm
              onCreated={handleClienteCreated}
              onCancel={() => setShowQuickClient(false)}
            />
          ) : (
            <Select
              value={clienteId || "__none"}
              onValueChange={(v) => setClienteId(v === "__none" ? "" : v)}
              disabled={isBusy}
            >
              <SelectTrigger><SelectValue placeholder="— Sem cliente —" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— Sem cliente —</SelectItem>
                {clientesList.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
        {(status === "terminado" || status === "fechado") && (
          <div className="space-y-1">
            <Label htmlFor="garantiaAte">Garantia até</Label>
            <Input
              id="garantiaAte"
              type="date"
              value={garantiaAte ?? ""}
              onChange={(e) => setGarantiaAte(e.target.value)}
              disabled={isBusy}
            />
          </div>
        )}
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
