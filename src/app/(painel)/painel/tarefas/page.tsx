import Link from "next/link";
import { getAllTarefas } from "@/lib/mongodb/tarefas";
import { getAllProjetos } from "@/lib/mongodb/projetos";
import { Topbar } from "@/components/painel/Topbar";
import { TarefasPorProjeto } from "@/components/painel/TarefasPorProjeto";
import { NovaTarefaGlobalButton } from "@/components/painel/NovaTarefaGlobalButton";
import { TAREFAS_VISIVEIS_STATUSES } from "@/types/projeto";
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
  const [allTarefasRaw, allProjetos, params] = await Promise.all([
    getAllTarefas(),
    getAllProjetos(),
    searchParams,
  ]);

  // Só tarefas de projetos em estados onde se podem criar tarefas (mesmo
  // conjunto que o NovaTarefaGlobalButton oferece — ver TAREFAS_VISIVEIS_STATUSES).
  const visiveis = new Set<string>(TAREFAS_VISIVEIS_STATUSES);
  const openIds = new Set(allProjetos.filter((p) => visiveis.has(p.status)).map((p) => p.id));
  const allTarefas = allTarefasRaw.filter((t) => openIds.has(t.projetoId));

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
  const counts: Record<TarefaFilter, number> = {
    todas: allTarefas.length,
    hoje: 0,
    semana: 0,
    vencidas: 0,
  };
  {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const weekEnd = new Date(start);
    weekEnd.setDate(weekEnd.getDate() + 7);
    for (const t of allTarefas) {
      if (!t.prazo) continue;
      const d = new Date(t.prazo);
      d.setHours(0, 0, 0, 0);
      if (d.getTime() === start.getTime()) counts.hoje += 1;
      if (d < start) counts.vencidas += 1;
      if (d >= start && d <= weekEnd) counts.semana += 1;
    }
  }

  return (
    <>
      <Topbar
        crumbs={["Painel", "Tarefas"]}
        titleHtml={`Tarefas · <em>${pendentes} aberta${pendentes !== 1 ? "s" : ""}</em>`}
        description="Acções associadas a projectos · ordenado por urgência."
        actions={<NovaTarefaGlobalButton projetos={allProjetos} />}
      />

      <div className="content">
        <div className="row between" style={{ flexWrap: "wrap", gap: 12 }}>
          <div className="tabs">
            {(Object.keys(FILTER_LABELS) as TarefaFilter[]).map((f) => (
              <Link key={f} href={buildUrl(f)} className={filter === f ? "active" : undefined}>
                {FILTER_LABELS[f]}
                {counts[f] > 0 && <span className="num">{counts[f]}</span>}
              </Link>
            ))}
          </div>
          <Link href={toggleFeitasUrl} className={cn("toggle", showFeitas && "on")}>
            <span className="sw" />
            Mostrar feitas
          </Link>
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
