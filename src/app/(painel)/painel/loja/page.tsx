import { getAllProductsAdmin } from "@/lib/mongodb/products";
import { LojaClient } from "@/components/painel/LojaClient";
import { requirePainelSession } from "@/lib/painel-auth";

export const dynamic = "force-dynamic";

export default async function LojaAdminPage() {
  await requirePainelSession();
  const products = await getAllProductsAdmin();
  return <LojaClient products={products} />;
}
