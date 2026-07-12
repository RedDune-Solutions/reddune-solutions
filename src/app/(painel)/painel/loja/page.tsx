import { getAllProductsAdmin } from "@/lib/mongodb/products";
import { LojaClient } from "@/components/painel/LojaClient";

export const dynamic = "force-dynamic";

export default async function LojaAdminPage() {
  const products = await getAllProductsAdmin();
  return <LojaClient products={products} />;
}
