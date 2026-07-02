import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPortfolioItemById } from "@/lib/mongodb/portfolio";
import { Topbar } from "@/components/painel/Topbar";
import { PortfolioForm } from "@/components/painel/PortfolioForm";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function PortfolioDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const item = await getPortfolioItemById(id);
  if (!item) notFound();

  return (
    <>
      <Topbar
        crumbs={["Painel", "Conteúdo", "Portfólio", item.title.pt]}
        title={item.title.pt}
        description="Trabalho do portfólio"
      />

      <div className="content max-w-3xl">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/painel/portfolio">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar ao portfólio
          </Link>
        </Button>

        <div className="rounded-xl border border-border bg-card">
          <PortfolioForm item={item} backHref="/painel/portfolio" />
        </div>
      </div>
    </>
  );
}
