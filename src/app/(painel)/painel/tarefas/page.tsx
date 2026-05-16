import { getAllTarefas, getSyncMeta } from "@/lib/mongodb/tarefas";
import { Topbar } from "@/components/painel/Topbar";
import { KanbanBoard } from "@/components/painel/KanbanBoard";
import { TarefasTable } from "@/components/painel/TarefasTable";
import { ViewToggle, type PainelView } from "@/components/painel/ViewToggle";
import { applyFilters } from "@/lib/filter-tarefas";
import { FilterBar } from "@/components/painel/FilterBar";
import { NovaTarefaButton } from "@/components/painel/NovaTarefaButton";
import { TAREFA_STATUS, TAREFA_TIPO, type TarefaStatus, type TarefaTipo } from "@/types/tarefa";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  view?: string;
  status?: string;
  tipo?: string;
  cliente?: string;
  q?: string;
}>;

export default async function TarefasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [allTarefas, meta, params] = await Promise.all([
    getAllTarefas(),
    getSyncMeta(),
    searchParams,
  ]);

  const view: PainelView = params.view === "lista" ? "lista" : "kanban";
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

  return (
    <>
      <Topbar
        title="Tarefas"
        description={`${tarefas.length} de ${allTarefas.length} tarefa${allTarefas.length === 1 ? "" : "s"} sincronizadas.`}
        syncedAt={meta?.updatedAt}
        syncCount={meta?.count}
      />

      <div className="px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <FilterBar tarefas={allTarefas} />
          <div className="flex items-center gap-2">
            <ViewToggle current={view} />
            <NovaTarefaButton />
          </div>
        </div>

        {view === "kanban" ? (
          <KanbanBoard tarefas={tarefas} />
        ) : (
          <TarefasTable tarefas={tarefas} />
        )}
      </div>
    </>
  );
}
