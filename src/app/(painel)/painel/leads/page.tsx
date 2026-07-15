import { Inbox } from "lucide-react";
import { requirePainelSession } from "@/lib/painel-auth";
import { getAllLeads } from "@/lib/mongodb/leads";
import { Topbar } from "@/components/painel/Topbar";
import { PushOptIn } from "@/components/painel/PushOptIn";
import { LeadsTable } from "@/components/painel/LeadsTable";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  await requirePainelSession();

  const leads = await getAllLeads();
  const novos = leads.filter((l) => l.estado === "novo").length;
  const emCurso = leads.filter(
    (l) => l.estado === "contactado" || l.estado === "orcamento"
  ).length;
  const ganhos = leads.filter((l) => l.estado === "ganho").length;

  return (
    <>
      <Topbar
        crumbs={["Leads"]}
        titleHtml={`${novos} <em>por tratar</em>`}
        actions={<PushOptIn />}
      />

      <div className="mini-kpis">
        <div className="k">
          <div className="kpi-label">Total</div>
          <div className="kpi-num">{leads.length}</div>
        </div>
        <div className="k accent">
          <div className="kpi-label">Novos</div>
          <div className="kpi-num">{novos}</div>
        </div>
        <div className="k">
          <div className="kpi-label">Em curso</div>
          <div className="kpi-num">{emCurso}</div>
        </div>
        <div className="k">
          <div className="kpi-label">Ganhos</div>
          <div className="kpi-num">{ganhos}</div>
        </div>
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
    </>
  );
}
