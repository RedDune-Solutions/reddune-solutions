import { Inbox, Clock, CheckCircle2, Loader } from "lucide-react";
import { getAllLeads } from "@/lib/mongodb/leads";
import { Topbar } from "@/components/painel/Topbar";
import { KpiCard } from "@/components/painel/KpiCard";
import { PushOptIn } from "@/components/painel/PushOptIn";
import { LeadsTable } from "@/components/painel/LeadsTable";

export const dynamic = "force-dynamic";

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
          <LeadsTable leads={leads} />
        )}
      </div>
    </>
  );
}
