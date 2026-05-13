import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Euro, ListChecks, AlertCircle, CheckCircle2 } from "lucide-react";
import { getAllTarefas, getSyncMeta } from "@/lib/mongodb/tarefas";
import { Topbar } from "@/components/painel/Topbar";
import { TarefaCard } from "@/components/painel/TarefaCard";
import { KpiCard } from "@/components/painel/KpiCard";
import { Button } from "@/components/ui/button";
import { findClienteBySlug } from "@/lib/slug";
import { STATUS_GROUPS, type TarefaPublic } from "@/types/tarefa";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export default async function ClienteDetailPage({ params }: { params: Params }) {
  const [{ slug }, allTarefas, meta] = await Promise.all([
    params,
    getAllTarefas(),
    getSyncMeta(),
  ]);

  const clientesUnique = Array.from(
    new Set(
      allTarefas
        .map((t) => t.cliente)
        .filter((c): c is string => Boolean(c && c.length > 0))
    )
  );
  const clienteName = findClienteBySlug(slug, clientesUnique);
  if (!clienteName) notFound();

  const tarefas = allTarefas.filter((t) => t.cliente === clienteName);

  const active = tarefas.filter(
    (t) =>
      STATUS_GROUPS.ativo.includes(t.status) ||
      STATUS_GROUPS.proximo.includes(t.status) ||
      STATUS_GROUPS.aguarda.includes(t.status)
  );
  const finished = tarefas.filter(
    (t) =>
      STATUS_GROUPS.pronto.includes(t.status) ||
      STATUS_GROUPS.arquivo.includes(t.status)
  );

  const totalValor = tarefas.reduce(
    (sum, t) => sum + (t.valorEstimado ?? 0),
    0
  );

  // Order by dataCriado desc (nulls last)
  const sorted = [...tarefas].sort((a, b) => {
    const aDate = a.dataCriado ?? "";
    const bDate = b.dataCriado ?? "";
    return bDate.localeCompare(aDate);
  });

  return (
    <>
      <Topbar
        title={clienteName}
        description={`${tarefas.length} tarefa${tarefas.length === 1 ? "" : "s"} no histórico.`}
        syncedAt={meta?.updatedAt}
        syncCount={meta?.count}
      />

      <div className="px-6 lg:px-8 py-8 space-y-10 max-w-6xl">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/painel/clientes">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar a clientes
          </Link>
        </Button>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Tarefas"
            value={tarefas.length}
            icon={ListChecks}
            tone="default"
          />
          <KpiCard
            label="Em curso/espera"
            value={active.length}
            icon={AlertCircle}
            tone="accent"
          />
          <KpiCard
            label="Concluídas"
            value={finished.length}
            icon={CheckCircle2}
            tone="green"
          />
          <KpiCard
            label="Valor estimado"
            value={`${totalValor.toFixed(0)}€`}
            icon={Euro}
            tone="default"
            hint="Soma de todas as tarefas"
          />
        </div>

        {active.length > 0 && (
          <section>
            <h2 className="font-headline text-xl md:text-2xl font-semibold tracking-tight mb-4">
              Activas
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {active.map((tarefa) => (
                <TarefaCard key={tarefa.id} tarefa={tarefa} />
              ))}
            </div>
          </section>
        )}

        {sorted.length > 0 && (
          <section>
            <h2 className="font-headline text-xl md:text-2xl font-semibold tracking-tight mb-4">
              Histórico completo
            </h2>
            <ClienteTimeline tarefas={sorted} />
          </section>
        )}
      </div>
    </>
  );
}

function ClienteTimeline({ tarefas }: { tarefas: TarefaPublic[] }) {
  return (
    <ol className="relative border-l border-border ml-3 space-y-6 pl-6">
      {tarefas.map((t) => (
        <li key={t.id} className="relative">
          <span
            aria-hidden="true"
            className="absolute -left-[28px] top-1.5 inline-flex h-3 w-3 rounded-full border-2 border-background bg-primary"
          />
          <TarefaCard tarefa={t} />
        </li>
      ))}
    </ol>
  );
}
