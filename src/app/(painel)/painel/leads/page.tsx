import { Inbox, Clock, CheckCircle2, Loader } from "lucide-react";
import { getAllLeads } from "@/lib/mongodb/leads";
import { Topbar } from "@/components/painel/Topbar";
import { KpiCard } from "@/components/painel/KpiCard";
import { SUBJECT_LABELS } from "@/lib/validation";
import { LEAD_ESTADO_LABELS, type LeadEstado } from "@/types/lead";
import { PushOptIn } from "@/components/painel/PushOptIn";
import { BlockIpButton } from "@/components/painel/BlockIpButton";

export const dynamic = "force-dynamic";

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

const ESTADO_STYLE: Record<LeadEstado, { bg: string; color: string }> = {
  novo: { bg: "rgba(214, 66, 42, 0.12)", color: "var(--dune)" },
  contactado: { bg: "rgba(214, 158, 46, 0.14)", color: "#9a6b14" },
  orcamento: { bg: "rgba(46, 110, 138, 0.12)", color: "#2f6f8a" },
  ganho: { bg: "rgba(63, 125, 74, 0.14)", color: "#3f7d4a" },
  perdido: { bg: "var(--cream-deep)", color: "var(--ink-mute)" },
};

export default async function LeadsPage() {
  const leads = await getAllLeads();
  const novos = leads.filter((l) => l.estado === "novo").length;
  const emCurso = leads.filter(
    (l) => l.estado === "contactado" || l.estado === "orcamento"
  ).length;
  const ganhos = leads.filter((l) => l.estado === "ganho").length;

  return (
    <>
      <Topbar
        crumbs={["Painel", "Leads"]}
        titleHtml={`Leads · <em>${leads.length}</em>`}
        description={`${novos} novos por tratar.`}
        actions={<PushOptIn />}
      />

      <div className="content">
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <KpiCard label="Total" value={leads.length} icon={Inbox} hint="enquiries captadas" />
          <KpiCard tone="accent" label="Novos" value={novos} icon={Clock} hint="por contactar" />
          <KpiCard tone="amber" label="Em curso" value={emCurso} icon={Loader} hint="contactado / orçamento" />
          <KpiCard tone="green" label="Ganhos" value={ganhos} icon={CheckCircle2} hint="convertidos" />
        </div>

        {leads.length === 0 ? (
          <div className="empty">
            <div className="ic"><Inbox aria-hidden="true" /></div>
            <div className="t">Sem leads</div>
            <div className="desc">
              As mensagens do formulário de contacto do site aparecem aqui automaticamente.
            </div>
          </div>
        ) : (
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
                  {leads.map((l) => {
                    const st = ESTADO_STYLE[l.estado] ?? ESTADO_STYLE.novo;
                    return (
                      <tr key={l.id}>
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
                          <span className="badge" style={{ background: st.bg, color: st.color }}>
                            <span className="dot" /> {LEAD_ESTADO_LABELS[l.estado] ?? l.estado}
                          </span>
                        </td>
                        <td className="col-hide-sm right">
                          <span className="muted" style={{ fontSize: 12 }}>{fmtDate(l.criadoEm)}</span>
                        </td>
                        <td className="col-hide-sm">
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <span className="mono muted" style={{ fontSize: 10.5 }}>{l.ip ?? "—"}</span>
                            {l.ip ? <BlockIpButton ip={l.ip} /> : null}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
