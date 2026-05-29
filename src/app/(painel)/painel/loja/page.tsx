import { Package, Check, Star, EyeOff } from "lucide-react";
import { getAllProductsAdmin } from "@/lib/mongodb/products";
import { Topbar } from "@/components/painel/Topbar";
import { KpiCard } from "@/components/painel/KpiCard";
import { LojaClient } from "@/components/painel/LojaClient";

export const dynamic = "force-dynamic";

export default async function LojaAdminPage() {
  const products = await getAllProductsAdmin();

  const total = products.length;
  const disponiveis = products.filter((p) => p.available).length;
  const destaques = products.filter((p) => p.featured).length;
  const ocultos = total - disponiveis;

  return (
    <>
      <Topbar
        crumbs={["Painel", "Conteúdo", "Loja"]}
        titleHtml={`Loja · <em>${total} produto${total === 1 ? "" : "s"}</em>`}
        description="Catálogo da loja pública."
      />
      <div className="content">
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <KpiCard label="Total" value={total} icon={Package} hint="no catálogo" />
          <KpiCard tone="green" label="Disponíveis" value={disponiveis} icon={Check} hint="visíveis na loja" />
          <KpiCard tone="accent" label="Destaques" value={destaques} icon={Star} hint="em evidência" />
          <KpiCard tone="amber" label="Ocultos" value={ocultos} icon={EyeOff} hint="não publicados" />
        </div>
        <LojaClient products={products} />
      </div>
    </>
  );
}
