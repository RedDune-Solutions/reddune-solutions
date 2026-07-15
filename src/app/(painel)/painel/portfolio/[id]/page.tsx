import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePainelSession } from "@/lib/painel-auth";
import { getPortfolioItemById } from "@/lib/mongodb/portfolio";
import { Topbar } from "@/components/painel/Topbar";
import { PortfolioForm } from "@/components/painel/PortfolioForm";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function PortfolioDetailPage({ params }: { params: Params }) {
  await requirePainelSession();

  const { id } = await params;
  const item = await getPortfolioItemById(id);
  if (!item) notFound();

  return (
    <>
      <Topbar
        crumbs={["Portfólio"]}
        title={item.title.pt}
        description="Trabalho do portfólio"
      />

      <div className="detail-top">
        <Link href="/painel/portfolio" className="back-btn">
          <ArrowLeft className="ic" aria-hidden="true" />
          Voltar ao portfólio
        </Link>
      </div>

      <div className="card max-w-3xl" style={{ padding: 0, overflow: "hidden" }}>
        <PortfolioForm item={item} backHref="/painel/portfolio" />
      </div>
    </>
  );
}
