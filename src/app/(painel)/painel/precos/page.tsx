import { Topbar } from "@/components/painel/Topbar";
import { ServicosEditor } from "@/components/painel/ServicosEditor";
import { SeedServicosButton } from "@/components/painel/SeedServicosButton";
import { getAllServicos } from "@/lib/mongodb/servicos";
import { SERVICO_SLUG, type ServicoSlug } from "@/types/servico";

export const dynamic = "force-dynamic";

export default async function PrecosPage() {
  const all = await getAllServicos();
  const porSlug: Record<ServicoSlug, typeof all> = {
    "assistencia-tecnica": [],
    "web-digital": [],
    "software-recuperacao": [],
  };
  for (const s of all) {
    porSlug[s.slug].push(s);
  }

  const totalServicos = all.length;

  return (
    <>
      <Topbar
        title="Preços dos serviços"
        description="Edita os preços que aparecem nas páginas públicas /servicos."
      />

      <div className="px-6 lg:px-8 py-8 space-y-6">
        {totalServicos === 0 && <SeedServicosButton />}
        {SERVICO_SLUG.map((slug) => (
          <ServicosEditor key={slug} slug={slug} servicos={porSlug[slug]} />
        ))}
      </div>
    </>
  );
}
