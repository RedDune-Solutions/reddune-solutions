import { getAllPortfolioItems } from "@/lib/mongodb/portfolio";
import { Topbar } from "@/components/painel/Topbar";
import { PortfolioClient } from "@/components/painel/PortfolioClient";

export const dynamic = "force-dynamic";

export default async function PortfolioAdminPage() {
  const items = await getAllPortfolioItems();

  return (
    <>
      <Topbar title="Portfólio" description="Trabalhos publicados na página pública." />
      <div className="px-6 lg:px-8 py-8">
        <PortfolioClient items={items} />
      </div>
    </>
  );
}
