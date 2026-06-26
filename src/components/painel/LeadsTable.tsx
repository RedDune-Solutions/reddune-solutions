"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, Trash2, Loader2, Calendar, Globe } from "lucide-react";
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

const ESTADO_STYLE: Record<LeadEstado, { bg: string; color: string }> = {
  novo: { bg: "rgba(214, 66, 42, 0.12)", color: "var(--dune)" },
  contactado: { bg: "rgba(214, 158, 46, 0.14)", color: "#9a6b14" },
  orcamento: { bg: "rgba(46, 110, 138, 0.12)", color: "#2f6f8a" },
  ganho: { bg: "rgba(63, 125, 74, 0.14)", color: "#3f7d4a" },
  perdido: { bg: "var(--cream-deep)", color: "var(--ink-mute)" },
};

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

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

function EstadoBadge({ estado }: { estado: LeadEstado }) {
  const st = ESTADO_STYLE[estado] ?? ESTADO_STYLE.novo;
  return (
    <span className="badge" style={{ background: st.bg, color: st.color }}>
      <span className="dot" /> {LEAD_ESTADO_LABELS[estado] ?? estado}
    </span>
  );
}

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<"estado" | "delete" | null>(null);
  const [, startTransition] = useTransition();

  const selected = leads.find((l) => l.id === openId) ?? null;

  async function changeEstado(id: string, estado: LeadEstado) {
    setBusy("estado");
    const res = await safeFetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    setBusy(null);
    if (!res.ok) {
      toast({ title: "Erro a mudar estado", description: res.error, variant: "destructive" });
      return;
    }
    startTransition(() => router.refresh());
  }

  async function remove(id: string) {
    if (!window.confirm("Eliminar este lead? Não há como recuperar.")) return;
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

  return (
    <>
      <div className="card flat" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Contacto</th>
                <th className="col-hide-sm" style={{ width: 170 }}>Assunto</th>
                <th className="col-hide-sm">Mensagem</th>
                <th style={{ width: 120 }}>Estado</th>
                <th className="col-hide-sm right" style={{ width: 130 }}>Recebido</th>
                <th className="col-hide-sm" style={{ width: 150 }}>IP</th>
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
                  <td>
                    <span className="ttl-cell">
                      {l.nome}
                      <span className="sub mono" style={{ fontSize: 10.5 }}>{l.email}</span>
                    </span>
                  </td>
                  <td className="col-hide-sm">
                    <span className="muted" style={{ fontSize: 12 }}>
                      {SUBJECT_LABELS[l.subject] ?? l.subject}
                    </span>
                  </td>
                  <td className="col-hide-sm">
                    <span
                      className="muted"
                      style={{
                        fontSize: 12,
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
                  <td>
                    <EstadoBadge estado={l.estado} />
                  </td>
                  <td className="col-hide-sm right">
                    <span className="muted" style={{ fontSize: 12 }}>{fmtDate(l.criadoEm)}</span>
                  </td>
                  <td className="col-hide-sm" onClick={(e) => e.stopPropagation()}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span className="mono muted" style={{ fontSize: 10.5 }}>{l.ip ?? "—"}</span>
                      {l.ip ? <BlockIpButton ip={l.ip} /> : null}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
                  <EstadoBadge estado={selected.estado} />
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
                    value={selected.estado}
                    onValueChange={(v) => changeEstado(selected.id, v as LeadEstado)}
                    disabled={busy === "estado"}
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
