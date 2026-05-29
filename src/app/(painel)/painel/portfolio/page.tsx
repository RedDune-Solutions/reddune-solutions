import { Briefcase, Star, Link2, FolderOpen } from "lucide-react";
import { getAllPortfolioItems } from "@/lib/mongodb/portfolio";
import { Topbar } from "@/components/painel/Topbar";
import { KpiCard } from "@/components/painel/KpiCard";
import { PortfolioClient } from "@/components/painel/PortfolioClient";

export const dynamic = "force-dynamic";

export default async function PortfolioAdminPage() {
  const items = await getAllPortfolioItems();

  const total = items.length;
  const destaques = items.filter((i) => i.destaqueLanding).length;
  const comLink = items.filter((i) => !!i.url).length;
  const semCategoria = items.filter((i) => !i.categoria).length;

  return (
    <>
      <Topbar
        crumbs={["Painel", "Conteúdo", "Portfólio"]}
        titleHtml={`Portfólio · <em>${total} trabalho${total === 1 ? "" : "s"}</em>`}
        description="Casos publicados em /portfolio."
      />
      <div className="content">
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <KpiCard label="Total" value={total} icon={Briefcase} hint="trabalhos" />
          <KpiCard tone="accent" label="Destaque · landing" value={destaques} icon={Star} hint="na página inicial" />
          <KpiCard tone="green" label="Com link" value={comLink} icon={Link2} hint="ligados a URL" />
          <KpiCard tone="amber" label="Sem categoria" value={semCategoria} icon={FolderOpen} hint="por classificar" />
        </div>
        <PortfolioClient items={items} />
      </div>
    </>
  );
}
