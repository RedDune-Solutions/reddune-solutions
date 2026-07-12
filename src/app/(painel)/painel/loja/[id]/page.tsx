import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getProductById } from "@/lib/mongodb/products";
import { Topbar } from "@/components/painel/Topbar";
import { ProductForm } from "@/components/painel/ProductForm";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function ProdutoDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <>
      <Topbar
        crumbs={["Loja"]}
        title={product.name.pt}
        description="Produto da loja"
      />

      <div className="detail-top">
        <Link href="/painel/loja" className="back-btn">
          <ArrowLeft className="ic" aria-hidden="true" />
          Voltar à loja
        </Link>
      </div>

      <div className="card max-w-4xl" style={{ padding: 0, overflow: "hidden" }}>
        <ProductForm product={product} backHref="/painel/loja" />
      </div>
    </>
  );
}
