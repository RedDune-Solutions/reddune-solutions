import { ChevronRight } from "lucide-react";
import { Topbar } from "@/components/painel/Topbar";
import { ServicosEditor } from "@/components/painel/ServicosEditor";
import { SeedServicosButton } from "@/components/painel/SeedServicosButton";
import { NovaCategoriaServicoButton } from "@/components/painel/NovaCategoriaServicoButton";
import { getAllServicos } from "@/lib/mongodb/servicos";
import { getAllServicoCategorias } from "@/lib/mongodb/servico-categorias";
import { SERVICO_SLUG, SERVICO_SLUG_LABEL } from "@/types/servico";

export const dynamic = "force-dynamic";

export default async function PrecosPage() {
  const [all, customCats] = await Promise.all([
    getAllServicos(),
    getAllServicoCategorias(),
  ]);

  // group by slug (any string)
  const porSlug: Record<string, typeof all> = {};
  for (const s of all) {
    if (!porSlug[s.slug]) porSlug[s.slug] = [];
    porSlug[s.slug].push(s);
  }

  // base categories (hardcoded, for project type system)
  const baseCats = SERVICO_SLUG.map((slug) => ({ slug, label: SERVICO_SLUG_LABEL[slug] }));
  // custom categories from DB
  const allCats = [
    ...baseCats,
    ...customCats.map((c) => ({ slug: c.slug, label: c.label })),
  ];

  const totalServicos = all.length;

  return (
    <>
      <Topbar
        title="Preços dos serviços"
        description="Edita os preços que aparecem nas páginas públicas /servicos."
      />

      <div className="px-6 lg:px-8 py-8 space-y-6">
        {totalServicos === 0 && <SeedServicosButton />}

        {allCats.map(({ slug, label }) => (
          <details
            key={slug}
            open={(porSlug[slug]?.length ?? 0) > 0}
            className="group rounded-xl border border-border-strong bg-card overflow-hidden"
          >
            <summary className="flex items-center justify-between gap-3 cursor-pointer select-none px-6 py-4 hover:bg-muted/40 transition-colors list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-3">
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                <h2 className="font-headline text-base font-semibold text-foreground">
                  {label}
                </h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                  ({porSlug[slug]?.length ?? 0})
                </span>
              </div>
            </summary>
            <div className="border-t border-border">
              <ServicosEditor slug={slug} servicos={porSlug[slug] ?? []} />
            </div>
          </details>
        ))}

        {/* Gestão de categorias custom */}
        <details className="group rounded-xl border border-border-strong bg-card overflow-hidden">
          <summary className="flex items-center gap-3 cursor-pointer select-none px-6 py-4 hover:bg-muted/40 transition-colors list-none [&::-webkit-details-marker]:hidden">
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
            <h2 className="font-headline text-base font-semibold text-foreground">
              Gerir categorias
            </h2>
          </summary>
          <div className="border-t border-border px-6 py-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              As 3 categorias base (Assistência Técnica, Web &amp; Digital, Software &amp; Recuperação) não podem ser removidas — estão ligadas ao sistema de tipos de projecto.
            </p>
            <NovaCategoriaServicoButton categorias={customCats} />
          </div>
        </details>
      </div>
    </>
  );
}
