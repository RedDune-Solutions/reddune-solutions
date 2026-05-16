import { getAllProductsAdmin } from "@/lib/mongodb/products";
import { Topbar } from "@/components/painel/Topbar";
import { LojaClient } from "@/components/painel/LojaClient";

export const dynamic = "force-dynamic";

export default async function LojaAdminPage() {
  const products = await getAllProductsAdmin();

  return (
    <>
      <Topbar title="Loja" description="Gestão de produtos da loja pública." />
      <div className="px-6 lg:px-8 py-8">
        <LojaClient products={products} />
      </div>
    </>
  );
}
