import { ChevronRight } from "lucide-react";
import { Topbar } from "@/components/painel/Topbar";
import { ServicosEditor } from "@/components/painel/ServicosEditor";
import { SeedServicosButton } from "@/components/painel/SeedServicosButton";
import { getAllServicos } from "@/lib/mongodb/servicos";
import { SERVICO_SLUG, SERVICO_SLUG_LABEL, type ServicoSlug } from "@/types/servico";

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
          <details
            key={slug}
            open={porSlug[slug].length > 0}
            className="group rounded-xl border border-border-strong bg-card overflow-hidden"
          >
            <summary className="flex items-center justify-between gap-3 cursor-pointer select-none px-6 py-4 hover:bg-muted/40 transition-colors list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-3">
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                <h2 className="font-headline text-base font-semibold text-foreground">
                  {SERVICO_SLUG_LABEL[slug]}
                </h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                  ({porSlug[slug].length})
                </span>
              </div>
            </summary>
            <div className="border-t border-border">
              <ServicosEditor slug={slug} servicos={porSlug[slug]} />
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
