import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getProductById } from "@/lib/mongodb/products";
import { Topbar } from "@/components/painel/Topbar";
import { ProductForm } from "@/components/painel/ProductForm";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function ProdutoDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <>
      <Topbar title={product.name.pt} description="Produto da loja" />

      <div className="content max-w-4xl">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/painel/loja">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar à loja
          </Link>
        </Button>

        <div className="rounded-xl border border-border bg-card">
          <ProductForm product={product} backHref="/painel/loja" />
        </div>
      </div>
    </>
  );
}
