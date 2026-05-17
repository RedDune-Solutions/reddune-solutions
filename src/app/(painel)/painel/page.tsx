import Link from "next/link";
import { ListChecks, Hourglass, CheckCircle2, AlertCircle, ArrowRight, Users, AlertTriangle } from "lucide-react";
import { getAllProjetos } from "@/lib/mongodb/projetos";
import { getAllClientes } from "@/lib/mongodb/clientes";
import { getAllPagamentos } from "@/lib/mongodb/pagamentos";
import { Topbar } from "@/components/painel/Topbar";
import { KpiCard } from "@/components/painel/KpiCard";
import { TarefaCard } from "@/components/painel/TarefaCard";
import { TodayWidget } from "@/components/painel/TodayWidget";
import { Button } from "@/components/ui/button";
import { STATUS_GROUPS } from "@/types/projeto";

export const dynamic = "force-dynamic";

export default async function PainelOverviewPage() {
  const [projetos, clientes, pagamentos] = await Promise.all([
    getAllProjetos(),
    getAllClientes(),
    getAllPagamentos(),
  ]);

  const pagoPorProjeto = new Map<string, number>();
  for (const p of pagamentos) {
    pagoPorProjeto.set(p.projetoId, (pagoPorProjeto.get(p.projetoId) ?? 0) + p.valor);
  }
  const dividas = projetos.filter(
    (p) =>
      p.status === "terminado" &&
      p.valorEstimado != null &&
      (pagoPorProjeto.get(p.id) ?? 0) < p.valorEstimado
  );
  const dividasCount = dividas.length;
  const dividasValor = dividas.reduce(
    (sum, p) => sum + ((p.valorEstimado ?? 0) - (pagoPorProjeto.get(p.id) ?? 0)),
    0
  );

  const counts = {
    total: projetos.length,
    emCurso: projetos.filter((p) => STATUS_GROUPS.ativo.includes(p.status)).length,
    proximos: projetos.filter((p) => STATUS_GROUPS.proximo.includes(p.status)).length,
    aguarda: projetos.filter((p) => STATUS_GROUPS.aguarda.includes(p.status)).length,
    pronto: projetos.filter((p) => STATUS_GROUPS.pronto.includes(p.status)).length,
  };

  const proximaAccaoProjetos = projetos
    .filter(
      (p) =>
        STATUS_GROUPS.ativo.includes(p.status) ||
        STATUS_GROUPS.proximo.includes(p.status)
    )
    .filter((p) => p.proximaAccao && p.proximaAccao.length > 0)
    .slice(0, 6);

  return (
    <>
      <Topbar
        title="Visão geral"
        description="Estado actual de projectos e clientes."
      />

      <div className="px-6 lg:px-8 py-8 space-y-10">
        {projetos.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <TodayWidget projetos={projetos} />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Em curso"
                value={counts.emCurso}
                icon={ListChecks}
                tone="accent"
                hint={`${counts.total} no total`}
              />
              <KpiCard
                label="Próximos"
                value={counts.proximos}
                icon={ArrowRight}
                tone="default"
                hint="Backlog imediato"
              />
              <KpiCard
                label="Em espera"
                value={counts.aguarda}
                icon={Hourglass}
                tone="amber"
                hint="Aguarda cliente, peças ou fornecedor"
              />
              <KpiCard
                label="Prontos"
                value={counts.pronto}
                icon={CheckCircle2}
                tone="green"
                hint="Falta entregar/cobrar"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <KpiCard
                label="Clientes"
                value={clientes.length}
                icon={Users}
                tone="default"
                hint="Total de fichas"
              />
              <KpiCard
                label="Em dívida"
                value={dividasCount}
                icon={AlertTriangle}
                tone="amber"
                hint={
                  dividasValor > 0
                    ? `${dividasValor.toLocaleString("pt-PT", { minimumFractionDigits: 2 })} € estimados`
                    : "Sem valor estimado"
                }
              />
            </div>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline text-xl md:text-2xl font-semibold tracking-tight">
                  Próximas acções
                </h2>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/painel/projetos?view=kanban">
                    Ver todos
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
              {proximaAccaoProjetos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sem próximas acções activas. Tudo em dia.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {proximaAccaoProjetos.map((projeto) => (
                    <TarefaCard key={projeto.id} projeto={projeto} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-cream/30 px-6 py-16 text-center">
      <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <h2 className="mt-4 font-headline text-2xl font-semibold tracking-tight">
        Sem dados ainda
      </h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        Vai a <strong>Projectos</strong> e cria o primeiro projecto, ou corre a migração em{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/api/migrate</code> (POST) para importar dados existentes.
      </p>
    </div>
  );
}
