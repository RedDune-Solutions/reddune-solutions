import { getAllProjetos } from "@/lib/mongodb/projetos";
import { getAllClientes } from "@/lib/mongodb/clientes";
import { applyFilters } from "@/lib/filter-projetos";
import { Topbar } from "@/components/painel/Topbar";
import { KanbanBoard } from "@/components/painel/KanbanBoard";
import { TarefasTable } from "@/components/painel/TarefasTable";
import { ViewToggle, type PainelView } from "@/components/painel/ViewToggle";
import { FilterBar } from "@/components/painel/FilterBar";
import { NovaTarefaButton } from "@/components/painel/NovaTarefaButton";
import { PROJETO_STATUS, PROJETO_TIPO, type ProjetoStatus, type ProjetoTipo } from "@/types/projeto";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  view?: string;
  status?: string;
  tipo?: string;
  cliente?: string;
  q?: string;
}>;

export default async function ProjetosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [allProjetos, clientes, params] = await Promise.all([
    getAllProjetos(),
    getAllClientes(),
    searchParams,
  ]);

  const view: PainelView = params.view === "lista" ? "lista" : "kanban";

  const statusParam =
    params.status && PROJETO_STATUS.includes(params.status as ProjetoStatus)
      ? (params.status as ProjetoStatus)
      : undefined;
  const tipoParam =
    params.tipo && PROJETO_TIPO.includes(params.tipo as ProjetoTipo)
      ? (params.tipo as ProjetoTipo)
      : undefined;

  const projetos = applyFilters(allProjetos, {
    status: statusParam,
    tipo: tipoParam,
    clienteNome: params.cliente,
    q: params.q,
  });

  return (
    <>
      <Topbar
        title="Projectos"
        description="Estado e organização do trabalho."
      />

      <div className="px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <FilterBar projetos={allProjetos} />
          <div className="flex items-center gap-2">
            <ViewToggle current={view} />
            <NovaTarefaButton clientes={clientes} />
          </div>
        </div>

        {view === "kanban" ? (
          <KanbanBoard projetos={projetos} />
        ) : (
          <TarefasTable projetos={projetos} />
        )}
      </div>
    </>
  );
}
