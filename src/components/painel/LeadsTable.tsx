"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, Trash2, Loader2, Calendar, Globe, UserPlus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BlockIpButton } from "@/components/painel/BlockIpButton";
import { SUBJECT_LABELS } from "@/lib/validation";
import {
  LEAD_ESTADOS,
  LEAD_ESTADO_LABELS,
  type Lead,
  type LeadEstado,
} from "@/types/lead";
import { safeFetch } from "@/lib/safe-fetch";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

/** Pills do protótipo: Novo → .warm, Ganho → .ok, resto → .mute. */
function EstadoPill({ estado }: { estado: LeadEstado }) {
  const tone = estado === "novo" ? "warm" : estado === "ganho" ? "ok" : "mute";
  return <span className={`pill ${tone}`}>{LEAD_ESTADO_LABELS[estado] ?? estado}</span>;
}

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<"delete" | "convert" | null>(null);
  // Override otimista do estado por id — UI reage já, servidor sincroniza depois.
  const [overrides, setOverrides] = useState<Record<string, LeadEstado>>({});
  const [, startTransition] = useTransition();

  const estadoOf = (l: Lead): LeadEstado => overrides[l.id] ?? l.estado;
  const selected = leads.find((l) => l.id === openId) ?? null;

  async function changeEstado(id: string, estado: LeadEstado) {
    const previous = overrides[id] ?? leads.find((l) => l.id === id)?.estado;
    setOverrides((o) => ({ ...o, [id]: estado })); // otimista
    const res = await safeFetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    if (!res.ok) {
      // Revert só se o override ainda for o valor que ESTE pedido escreveu
      // (evita sobrepor uma mudança posterior concorrente).
      setOverrides((o) => {
        if (o[id] !== estado) return o;
        const n = { ...o };
        if (previous) n[id] = previous;
        else delete n[id];
        return n;
      });
      toast({ title: "Erro a mudar estado", description: res.error, variant: "destructive" });
      return;
    }
    // Sucesso: limpa o override (só se ainda for este valor) para o servidor
    // voltar a mandar após o refresh; não sobrepõe mudanças posteriores.
    setOverrides((o) => {
      if (o[id] !== estado) return o;
      const n = { ...o };
      delete n[id];
      return n;
    });
    startTransition(() => router.refresh()); // sincroniza KPIs/ordem em background
  }

  async function remove(id: string) {
    const ok = await confirm({
      title: "Eliminar este lead?",
      description: "Não há como recuperar.",
      confirmLabel: "Eliminar",
      tone: "destructive",
    });
    if (!ok) return;
    setBusy("delete");
    const res = await safeFetch(`/api/leads/${id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) {
      toast({ title: "Erro a eliminar", description: res.error, variant: "destructive" });
      return;
    }
    setOpenId(null);
    startTransition(() => router.refresh());
  }

  async function convert(id: string) {
    setBusy("convert");
    const res = await safeFetch<{ clienteId: string }>(`/api/leads/${id}/convert`, {
      method: "POST",
    });
    setBusy(null);
    if (!res.ok) {
      toast({ title: "Erro a converter", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Lead convertido em cliente" });
    setOpenId(null);
    router.push(`/painel/clientes/${res.data.clienteId}`);
  }

  return (
    <>
      <table className="tbl">
        <thead>
          <tr>
            <th>Contacto</th>
            <th className="col-hide-sm">Mensagem</th>
            <th className="col-hide-sm">Origem</th>
            <th>Estado</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr
              key={l.id}
              onClick={() => setOpenId(l.id)}
              style={{ cursor: "pointer" }}
              title="Abrir lead"
            >
              <td className="name">
                {l.nome}
                <div className="muted" style={{ fontWeight: 400 }}>{l.email}</div>
              </td>
              <td className="muted col-hide-sm">
                <span
                  style={{
                    display: "block",
                    maxWidth: 360,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {l.mensagem}
                </span>
              </td>
              <td className="col-hide-sm"><span className="pill mute">Formulário</span></td>
              <td><EstadoPill estado={estadoOf(l)} /></td>
              {l.clienteId ? (
                <td className="arr">→</td>
              ) : (
                <td onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="btn-ghost"
                    disabled={busy !== null}
                    onClick={() => convert(l.id)}
                  >
                    {busy === "convert" && (
                      <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                    )}
                    Converter
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <Sheet open={openId !== null} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent side="right" className="overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.nome}</SheetTitle>
                <SheetDescription>
                  <a href={`mailto:${selected.email}`} className="underline">
                    {selected.email}
                  </a>
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-5 px-6 py-2 text-sm text-ink">
                <div className="flex items-center gap-2">
                  <EstadoPill estado={estadoOf(selected)} />
                  <span className="text-ink-soft" style={{ fontSize: 12 }}>
                    {SUBJECT_LABELS[selected.subject] ?? selected.subject}
                  </span>
                </div>

                <div>
                  <div className="mb-1 text-ink-soft" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>
                    Mensagem
                  </div>
                  <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{selected.mensagem}</p>
                </div>

                <div className="flex flex-col gap-2 text-ink-soft" style={{ fontSize: 12 }}>
                  <span className="inline-flex items-center gap-2">
                    <Calendar size={13} aria-hidden="true" /> {fmtDateTime(selected.criadoEm)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Globe size={13} aria-hidden="true" />
                    <span className="mono">{selected.ip ?? "—"}</span>
                    {selected.ip ? <BlockIpButton ip={selected.ip} /> : null}
                  </span>
                </div>

                <div>
                  <div className="mb-1 text-ink-soft" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>
                    Estado
                  </div>
                  <Select
                    value={estadoOf(selected)}
                    onValueChange={(v) => changeEstado(selected.id, v as LeadEstado)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_ESTADOS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {LEAD_ESTADO_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SheetFooter>
                <button
                  type="button"
                  onClick={() => remove(selected.id)}
                  disabled={busy !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-btn border border-dune-deep/15 px-3 py-2 text-sm text-ember hover:bg-ember/10 transition-colors disabled:opacity-50"
                >
                  {busy === "delete" ? (
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 size={14} aria-hidden="true" />
                  )}
                  Eliminar
                </button>
                {selected.clienteId ? (
                  <a
                    href={`/painel/clientes/${selected.clienteId}`}
                    className="inline-flex items-center justify-center gap-2 rounded-btn border border-dune-deep/15 px-3 py-2 text-sm text-ink-soft hover:bg-ink/5 transition-colors"
                  >
                    <UserPlus size={14} aria-hidden="true" /> Ver cliente
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => convert(selected.id)}
                    disabled={busy !== null}
                    className="inline-flex items-center justify-center gap-2 rounded-btn border border-dune-deep/15 px-3 py-2 text-sm text-ink hover:bg-ink/5 transition-colors disabled:opacity-50"
                  >
                    {busy === "convert" ? (
                      <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <UserPlus size={14} aria-hidden="true" />
                    )}
                    Converter em cliente
                  </button>
                )}
                <a
                  href={`mailto:${selected.email}?subject=${encodeURIComponent(
                    "RE: " + (SUBJECT_LABELS[selected.subject] ?? selected.subject)
                  )}`}
                  className="inline-flex items-center justify-center gap-2 rounded-btn bg-ember px-3 py-2 text-sm text-white hover:bg-ember/90 transition-colors"
                >
                  <Mail size={14} aria-hidden="true" /> Responder
                </a>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
