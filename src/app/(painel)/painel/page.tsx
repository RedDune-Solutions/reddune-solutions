import Link from "next/link";
import { ListChecks, Hourglass, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { getAllTarefas, getSyncMeta } from "@/lib/mongodb/tarefas";
import { Topbar } from "@/components/painel/Topbar";
import { KpiCard } from "@/components/painel/KpiCard";
import { TarefaCard } from "@/components/painel/TarefaCard";
import { TodayWidget } from "@/components/painel/TodayWidget";
import { Button } from "@/components/ui/button";
import { STATUS_GROUPS } from "@/types/tarefa";

export const dynamic = "force-dynamic";

export default async function PainelOverviewPage() {
  const [tarefas, meta] = await Promise.all([getAllTarefas(), getSyncMeta()]);

  const counts = {
    total: tarefas.length,
    emCurso: tarefas.filter((t) => STATUS_GROUPS.ativo.includes(t.status)).length,
    proximos: tarefas.filter((t) => STATUS_GROUPS.proximo.includes(t.status)).length,
    aguarda: tarefas.filter((t) => STATUS_GROUPS.aguarda.includes(t.status)).length,
    pronto: tarefas.filter((t) => STATUS_GROUPS.pronto.includes(t.status)).length,
  };

  const proximaAccaoTarefas = tarefas
    .filter(
      (t) =>
        STATUS_GROUPS.ativo.includes(t.status) ||
        STATUS_GROUPS.proximo.includes(t.status)
    )
    .filter((t) => t.proximaAccao && t.proximaAccao.length > 0)
    .slice(0, 6);

  return (
    <>
      <Topbar
        title="Visão geral"
        description="Estado actual de tarefas e projectos do Obsidian."
        syncedAt={meta?.updatedAt}
        syncCount={meta?.count}
      />

      <div className="px-6 lg:px-8 py-8 space-y-10">
        {tarefas.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <TodayWidget tarefas={tarefas} />

            {/* KPIs */}
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

            {/* Próximas acções */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline text-xl md:text-2xl font-semibold tracking-tight">
                  Próximas acções
                </h2>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/painel/tarefas?view=kanban">
                    Ver todas
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
              {proximaAccaoTarefas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sem próximas acções activas. Tudo em dia.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {proximaAccaoTarefas.map((tarefa) => (
                    <TarefaCard key={tarefa.id} tarefa={tarefa} />
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
        Clica em <strong>Sincronizar</strong> no topo (em dev), ou corre <code className="rounded bg-muted px-1.5 py-0.5 text-xs">npm run sync:obsidian</code> no PC.
      </p>
    </div>
  );
}
