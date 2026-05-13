import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getAllTarefas, getSyncMeta } from "@/lib/mongodb/tarefas";
import { Topbar } from "@/components/painel/Topbar";
import { FilterBar, applyFilters } from "@/components/painel/FilterBar";
import { clienteToSlug } from "@/lib/slug";
import { STATUS_GROUPS, type TarefaPublic, TAREFA_STATUS, TAREFA_TIPO, type TarefaStatus, type TarefaTipo } from "@/types/tarefa";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  status?: string;
  tipo?: string;
  cliente?: string;
  q?: string;
}>;

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [allTarefas, meta, params] = await Promise.all([
    getAllTarefas(),
    getSyncMeta(),
    searchParams,
  ]);

  const statusParam =
    params.status && TAREFA_STATUS.includes(params.status as TarefaStatus)
      ? (params.status as TarefaStatus)
      : undefined;
  const tipoParam =
    params.tipo && TAREFA_TIPO.includes(params.tipo as TarefaTipo)
      ? (params.tipo as TarefaTipo)
      : undefined;

  const tarefas = applyFilters(allTarefas, {
    status: statusParam,
    tipo: tipoParam,
    cliente: params.cliente,
    q: params.q,
  });

  const grouped = new Map<string, TarefaPublic[]>();
  for (const tarefa of tarefas) {
    if (tarefa.cliente && tarefa.cliente.trim().length > 0) {
      const list = grouped.get(tarefa.cliente) ?? [];
      list.push(tarefa);
      grouped.set(tarefa.cliente, list);
    }
  }

  const sortedClientes = [...grouped.entries()].sort(([a], [b]) =>
    a.localeCompare(b, "pt")
  );

  return (
    <>
      <Topbar
        title="Clientes"
        description={`${sortedClientes.length} cliente${sortedClientes.length === 1 ? "" : "s"}.`}
        syncedAt={meta?.updatedAt}
        syncCount={meta?.count}
      />

      <div className="px-6 lg:px-8 py-8 space-y-8">
        <FilterBar tarefas={allTarefas} />

        {sortedClientes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem clientes para os filtros actuais.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedClientes.map(([cliente, items]) => {
              const active = items.filter(
                (t) =>
                  STATUS_GROUPS.ativo.includes(t.status) ||
                  STATUS_GROUPS.proximo.includes(t.status) ||
                  STATUS_GROUPS.aguarda.includes(t.status)
              ).length;
              const slug = clienteToSlug(cliente);
              return (
                <Link
                  key={cliente}
                  href={`/painel/clientes/${slug}`}
                  className="group relative flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-5 transition-all duration-300 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-headline text-base font-semibold text-foreground leading-tight truncate">
                      {cliente}
                    </h3>
                    <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                      {items.length} tarefa{items.length === 1 ? "" : "s"}
                      {active > 0 && (
                        <span className="ml-2 text-accent">· {active} activa{active === 1 ? "" : "s"}</span>
                      )}
                    </p>
                  </div>
                  <ArrowUpRight
                    className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
