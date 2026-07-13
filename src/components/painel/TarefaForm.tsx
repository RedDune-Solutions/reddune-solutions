"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, Plus, X, Wand2 } from "lucide-react";
import type { ProjetoTipoCustom } from "@/lib/mongodb/projeto-tipos-custom";
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
  PROJETO_STATUS_FLUXO,
  PROJETO_TIPO_LABEL,
  CATEGORIA_TIPOS,
  TIPO_TO_CATEGORIA,
  isProjetoIdeia,
  type Projeto,
  type ProjetoStatus,
  type ProjetoTipo,
} from "@/types/projeto";
import { SERVICO_SLUG_LABEL, type ServicoSlug } from "@/types/servico";
import type { Cliente } from "@/types/cliente";
import { ClienteQuickForm } from "./ClienteQuickForm";
import { safeFetch, safeJsonPost, safeDelete } from "@/lib/safe-fetch";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";

type Props = {
  projeto?: Projeto;
  clientes?: Cliente[];
  onSaved?: (id: string) => void;
  onCancel?: () => void;
};

export function TarefaForm({ projeto, clientes = [], onSaved, onCancel }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [titulo, setTitulo] = useState(projeto?.titulo ?? "");
  const [clienteId, setClienteId] = useState(projeto?.clienteId ?? "");
  const [clientesList, setClientesList] = useState<Cliente[]>(clientes);
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [status, setStatus] = useState<ProjetoStatus>(projeto?.status ?? "proximo");
  const isIdeia = isProjetoIdeia(status);
  // Guarda o último estado de fluxo para repor quando se desmarca "Ideia".
  const prevFluxoRef = useRef<ProjetoStatus>(isIdeia ? "proximo" : status);
  function setIdeia(tipo: "ideia-interna" | "ideia-cliente" | null) {
    if (tipo === null) {
      setStatus(prevFluxoRef.current);
    } else {
      if (!isProjetoIdeia(status)) prevFluxoRef.current = status;
      setStatus(tipo);
    }
  }
  const [tipos, setTipos] = useState<string[]>(
    projeto?.tipos && projeto.tipos.length > 0
      ? projeto.tipos
      : projeto?.tipo
        ? [projeto.tipo]
        : []
  );
  const [customTipos, setCustomTipos] = useState<ProjetoTipoCustom[]>([]);
  const [categoria, setCategoria] = useState<ServicoSlug | null>(projeto?.categoria ?? null);
  const [prazo, setPrazo] = useState(projeto?.prazo ?? "");
  const [garantiaAte, setGarantiaAte] = useState(projeto?.garantiaAte ?? "");
  const [proximaAccao, setProximaAccao] = useState(projeto?.proximaAccao ?? "");
  const [notasResumo, setNotasResumo] = useState(projeto?.notasResumo ?? "");
  const [addingCat, setAddingCat] = useState<ServicoSlug | null>(null);
  const [newTipoLabel, setNewTipoLabel] = useState("");
  const [savingTipo, setSavingTipo] = useState(false);
  const newTipoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    safeFetch<ProjetoTipoCustom[]>("/api/projeto-tipos-custom").then((custom) => {
      if (cancelled) return;
      if (custom.ok && Array.isArray(custom.data)) setCustomTipos(custom.data);
    });
    return () => { cancelled = true; };
  }, []);

  function toggleTipo(slug: string, cat: ServicoSlug) {
    const active = tipos.includes(slug);
    if (active) {
      setTipos((prev) => prev.filter((x) => x !== slug));
    } else {
      setTipos((prev) => [...prev, slug]);
      if (!categoria) {
        const auto = TIPO_TO_CATEGORIA[slug as import("@/types/projeto").ProjetoTipo] ?? cat;
        setCategoria(auto);
      }
    }
  }

  async function saveCustomTipo(cat: ServicoSlug) {
    const label = newTipoLabel.trim();
    if (!label) return;
    setSavingTipo(true);
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const res = await safeJsonPost<ProjetoTipoCustom>("/api/projeto-tipos-custom/upsert", {
      slug,
      label,
      categoria: cat,
    });
    setSavingTipo(false);
    if (!res.ok) {
      toast({ title: "Erro a criar tipo", description: res.error, variant: "destructive" });
      return;
    }
    setCustomTipos((prev) => [...prev, res.data]);
    setTipos((prev) => [...prev, res.data.slug]);
    setNewTipoLabel("");
    setAddingCat(null);
  }

  async function deleteCustomTipo(tipo: ProjetoTipoCustom) {
    const res = await safeDelete(`/api/projeto-tipos-custom/${tipo.id}`);
    if (!res.ok) {
      toast({ title: "Erro a apagar tipo", description: res.error, variant: "destructive" });
      return;
    }
    setCustomTipos((prev) => prev.filter((c) => c.id !== tipo.id));
    setTipos((prev) => prev.filter((s) => s !== tipo.slug));
  }

  function handleClienteCreated(c: Cliente) {
    setClientesList((prev) => [...prev, c]);
    setClienteId(c.id);
    setShowQuickClient(false);
  }

  // Compõe um título dos campos preenchidos: {Tipo} {objeto} — {Cliente}.
  // Tipo = primeiro seleccionado ("Website" para web); objeto = hardware.modelo;
  // cliente = nome seleccionado. Sem IA.
  function tituloSugerido(): string {
    const tipoSlug = tipos[0];
    let tipoLabel = "";
    if (tipoSlug) {
      tipoLabel =
        tipoSlug === "web"
          ? "Website"
          : PROJETO_TIPO_LABEL[tipoSlug as ProjetoTipo] ??
            customTipos.find((c) => c.slug === tipoSlug)?.label ??
            tipoSlug;
    }
    const objeto = projeto?.hardware?.modelo?.trim() ?? "";
    // Cliente vazio -> sem cliente. Só recorre ao clienteNome do projecto se o
    // cliente seleccionado for o mesmo do projecto (evita meter no título um
    // cliente que foi removido/trocado).
    const cliente = !clienteId
      ? ""
      : clientesList.find((c) => c.id === clienteId)?.nome ??
        (clienteId === projeto?.clienteId ? projeto?.clienteNome ?? "" : "");
    const esquerda = [tipoLabel, objeto].filter(Boolean).join(" ");
    if (!esquerda) return cliente;
    return cliente ? `${esquerda} — ${cliente}` : esquerda;
  }

  async function gerarTitulo() {
    const sugestao = tituloSugerido();
    if (!sugestao) {
      toast({
        title: "Preenche o tipo ou o cliente primeiro",
        variant: "destructive",
      });
      return;
    }
    const actual = titulo.trim();
    if (actual && actual !== sugestao) {
      const ok = await confirm({
        title: "Substituir o título?",
        description: `«${actual}» → «${sugestao}»`,
        confirmLabel: "Substituir",
      });
      if (!ok) return;
    }
    setTitulo(sugestao);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
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
      prazo: prazo || null,
      proximaAccao: proximaAccao.trim() || null,
      notasResumo: notasResumo.trim() || null,
      garantiaAte: showGarantia ? (garantiaAte || null) : null,
    };

    const res = await safeJsonPost<{ id: string }>("/api/projetos/upsert", payload);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      toast({ title: "Erro a guardar projecto", description: res.error, variant: "destructive" });
      return;
    }

    toast({ title: "Projecto guardado", variant: "success" });
    startTransition(() => router.refresh());
    onSaved?.(res.data.id);
  }

  const isBusy = submitting || pending;

  return (
    <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="titulo">Título *</Label>
          <button
            type="button"
            onClick={gerarTitulo}
            disabled={isBusy}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
          >
            <Wand2 className="h-3 w-3" aria-hidden="true" />
            Gerar título
          </button>
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
      </div>

      <div className="space-y-1">
        <Label>Estado *</Label>
        <Select
          value={isIdeia ? undefined : status}
          onValueChange={(v) => setStatus(v as ProjetoStatus)}
          disabled={isBusy || isIdeia}
        >
          <SelectTrigger>
            <SelectValue placeholder={isIdeia ? "— (marcado como ideia)" : "Escolhe o estado"} />
          </SelectTrigger>
          <SelectContent>
            {PROJETO_STATUS_FLUXO.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Ideias: fora do fluxo. Marcar uma desliga o estado acima; o kanban
            (arrastar para as secções de Ideias) mexe no mesmo campo. */}
        <div className="flex flex-wrap gap-4 pt-1.5">
          <label className="inline-flex items-center gap-2 text-sm text-ink-soft cursor-pointer">
            <input
              type="checkbox"
              className="accent-ember"
              checked={status === "ideia-interna"}
              onChange={(e) => setIdeia(e.target.checked ? "ideia-interna" : null)}
              disabled={isBusy}
            />
            Ideia interna
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-ink-soft cursor-pointer">
            <input
              type="checkbox"
              className="accent-ember"
              checked={status === "ideia-cliente"}
              onChange={(e) => setIdeia(e.target.checked ? "ideia-cliente" : null)}
              disabled={isBusy}
            />
            Ideia de cliente
          </label>
        </div>
      </div>

      {/* Tipos — chips compactos em linha única por categoria */}
      <div className="space-y-1.5">
        <Label>Serviço / Tipo</Label>
        <div className="rounded-md border border-border bg-muted/30 p-2.5 space-y-2">
          {(Object.keys(CATEGORIA_TIPOS) as ServicoSlug[]).map((cat) => {
            const baseTipos = CATEGORIA_TIPOS[cat];
            const extraTipos = customTipos.filter((c) => c.categoria === cat);
            const isAddingHere = addingCat === cat;
            return (
              <div key={cat} className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground w-24 shrink-0">
                  {SERVICO_SLUG_LABEL[cat]}
                </span>
                {/* Base tipos */}
                {baseTipos.map((t) => {
                  const active = tipos.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={isBusy}
                      onClick={() => toggleTipo(t, cat)}
                      className={
                        "text-[11px] px-2 py-0.5 rounded-full border transition-colors " +
                        (active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground")
                      }
                    >
                      {PROJETO_TIPO_LABEL[t] ?? t}
                    </button>
                  );
                })}
                {/* Custom tipos — com botão × para eliminar */}
                {extraTipos.map((c) => {
                  const active = tipos.includes(c.slug);
                  return (
                    <span key={c.id} className="inline-flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => toggleTipo(c.slug, cat)}
                        className={
                          "text-[11px] px-2 py-0.5 rounded-l-full border-y border-l transition-colors " +
                          (active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground")
                        }
                      >
                        {c.label}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => deleteCustomTipo(c)}
                        title="Eliminar tipo"
                        className={
                          "text-[10px] px-1 py-0.5 rounded-r-full border-y border-r transition-colors " +
                          (active
                            ? "bg-primary text-primary-foreground border-primary hover:bg-red-500 hover:border-red-500"
                            : "bg-background text-muted-foreground border-border hover:bg-red-50 hover:text-red-600 hover:border-red-300")
                        }
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  );
                })}
                {/* Botão + ou input inline */}
                {isAddingHere ? (
                  <span className="inline-flex items-center gap-1">
                    <input
                      ref={newTipoInputRef}
                      autoFocus
                      type="text"
                      value={newTipoLabel}
                      onChange={(e) => setNewTipoLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); saveCustomTipo(cat); }
                        if (e.key === "Escape") { setAddingCat(null); setNewTipoLabel(""); }
                      }}
                      placeholder="Novo tipo…"
                      className="text-[11px] h-6 px-2 rounded-full border border-primary/50 bg-background outline-none w-28"
                    />
                    <button
                      type="button"
                      disabled={savingTipo || !newTipoLabel.trim()}
                      onClick={() => saveCustomTipo(cat)}
                      className="text-[10px] h-6 px-2 rounded-full bg-primary text-primary-foreground disabled:opacity-50"
                    >
                      {savingTipo ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : "OK"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAddingCat(null); setNewTipoLabel(""); }}
                      className="text-[10px] h-6 w-6 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => { setAddingCat(cat); setNewTipoLabel(""); }}
                    title="Adicionar tipo personalizado"
                    className="text-[10px] h-5 w-5 flex items-center justify-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary/60 hover:text-primary transition-colors"
                  >
                    <Plus className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            );
          })}
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
