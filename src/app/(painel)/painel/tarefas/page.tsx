import Link from "next/link";
import { getAllTarefas } from "@/lib/mongodb/tarefas";
import { getAllProjetos } from "@/lib/mongodb/projetos";
import { Topbar } from "@/components/painel/Topbar";
import { TarefasPorProjeto } from "@/components/painel/TarefasPorProjeto";
import { NovaTarefaGlobalButton } from "@/components/painel/NovaTarefaGlobalButton";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type TarefaFilter = "todas" | "hoje" | "semana" | "vencidas";

type SearchParams = Promise<{ filter?: string; feitas?: string }>;

const FILTER_LABELS: Record<TarefaFilter, string> = {
  todas: "Todas",
  hoje: "Hoje",
  semana: "Esta semana",
  vencidas: "Vencidas",
};

export default async function TarefasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [allTarefas, allProjetos, params] = await Promise.all([
    getAllTarefas(),
    getAllProjetos(),
    searchParams,
  ]);

  const filter: TarefaFilter =
    params.filter === "hoje" || params.filter === "semana" || params.filter === "vencidas"
      ? (params.filter as TarefaFilter)
      : "todas";

  const showFeitas = params.feitas === "1";

  // Build URL helper preserving feitas state
  const buildUrl = (f: TarefaFilter) => {
    const sp = new URLSearchParams();
    if (f !== "todas") sp.set("filter", f);
    if (showFeitas) sp.set("feitas", "1");
    const qs = sp.toString();
    return qs ? `/painel/tarefas?${qs}` : "/painel/tarefas";
  };

  const toggleFeitasUrl = (() => {
    const sp = new URLSearchParams();
    if (filter !== "todas") sp.set("filter", filter);
    if (!showFeitas) sp.set("feitas", "1");
    const qs = sp.toString();
    return qs ? `/painel/tarefas?${qs}` : "/painel/tarefas";
  })();

  const pendentes = allTarefas.filter((t) => !t.feita).length;

  return (
    <>
      <Topbar
        title="Tarefas"
        description={`${pendentes} acção${pendentes !== 1 ? "ões" : ""} pendente${pendentes !== 1 ? "s" : ""}.`}
      />

      <div className="px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {(Object.keys(FILTER_LABELS) as TarefaFilter[]).map((f) => (
              <Link
                key={f}
                href={buildUrl(f)}
                className={cn(
                  "text-sm font-medium px-3 py-1.5 rounded-md transition-colors",
                  filter === f
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {FILTER_LABELS[f]}
              </Link>
            ))}
            <Link
              href={toggleFeitasUrl}
              className={cn(
                "ml-2 text-xs font-mono uppercase tracking-wide px-2.5 py-1 rounded border transition-colors",
                showFeitas
                  ? "bg-muted border-border text-foreground"
                  : "border-dashed border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {showFeitas ? "✓ Feitas visíveis" : "Mostrar feitas"}
            </Link>
          </div>
          <NovaTarefaGlobalButton projetos={allProjetos} />
        </div>

        <TarefasPorProjeto
          tarefas={allTarefas}
          projetos={allProjetos}
          filter={filter}
          showFeitas={showFeitas}
        />
      </div>
    </>
  );
}
