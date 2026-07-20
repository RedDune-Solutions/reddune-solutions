import Link from "next/link";
import { getAllLembretes } from "@/lib/mongodb/lembretes";
import { getAllProjetos } from "@/lib/mongodb/projetos";
import { Topbar } from "@/components/painel/Topbar";
import { LembretesPorProjeto } from "@/components/painel/LembretesPorProjeto";
import { NovoLembreteGlobalButton } from "@/components/painel/NovoLembreteGlobalButton";
import { LEMBRETES_VISIVEIS_STATUSES } from "@/types/projeto";
import { requirePainelSession } from "@/lib/painel-auth";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type LembreteFilter = "todas" | "hoje" | "semana" | "vencidas";

type SearchParams = Promise<{ filter?: string; feitas?: string }>;

const FILTER_LABELS: Record<LembreteFilter, string> = {
  todas: "Todos",
  hoje: "Hoje",
  semana: "Semana",
  vencidas: "Vencidos",
};

export default async function LembretesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePainelSession();

  const [allLembretesRaw, allProjetos, params] = await Promise.all([
    getAllLembretes(),
    getAllProjetos(),
    searchParams,
  ]);

  // Lembretes de projectos em QUALQUER estado (incluindo fechados) — mesmo
  // conjunto que o NovoLembreteGlobalButton oferece (LEMBRETES_VISIVEIS_STATUSES).
  const visiveis = new Set<string>(LEMBRETES_VISIVEIS_STATUSES);
  const openIds = new Set(allProjetos.filter((p) => visiveis.has(p.status)).map((p) => p.id));
  const allLembretes = allLembretesRaw.filter((t) => openIds.has(t.projetoId));

  const filter: LembreteFilter =
    params.filter === "hoje" || params.filter === "semana" || params.filter === "vencidas"
      ? (params.filter as LembreteFilter)
      : "todas";

  const showFeitas = params.feitas === "1";

  // Build URL helper preserving feitas state
  const buildUrl = (f: LembreteFilter) => {
    const sp = new URLSearchParams();
    if (f !== "todas") sp.set("filter", f);
    if (showFeitas) sp.set("feitas", "1");
    const qs = sp.toString();
    return qs ? `/painel/lembretes?${qs}` : "/painel/lembretes";
  };

  const toggleFeitasUrl = (() => {
    const sp = new URLSearchParams();
    if (filter !== "todas") sp.set("filter", filter);
    if (!showFeitas) sp.set("feitas", "1");
    const qs = sp.toString();
    return qs ? `/painel/lembretes?${qs}` : "/painel/lembretes";
  })();

  const pendentes = allLembretes.filter((t) => !t.feita).length;
  // As tabs contam sobre o MESMO conjunto que a lista mostra (feitas escondidas
  // por defeito) — senão "Vencidas 5" abria uma lista quase vazia e "Todas"
  // contradizia o título "N abertas".
  const base = showFeitas ? allLembretes : allLembretes.filter((t) => !t.feita);
  const counts: Record<LembreteFilter, number> = {
    todas: base.length,
    hoje: 0,
    semana: 0,
    vencidas: 0,
  };
  {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const weekEnd = new Date(start);
    weekEnd.setDate(weekEnd.getDate() + 7);
    for (const t of base) {
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
        crumbs={["Lembretes"]}
        titleHtml={`${pendentes} <em>aberto${pendentes !== 1 ? "s" : ""}</em>`}
        actions={
          <>
            <div className="view-tabs">
              {(Object.keys(FILTER_LABELS) as LembreteFilter[]).map((f) => (
                <Link key={f} href={buildUrl(f)} className={filter === f ? "on" : undefined}>
                  {FILTER_LABELS[f]}
                  {counts[f] > 0 && <span className="num">{counts[f]}</span>}
                </Link>
              ))}
            </div>
            <NovoLembreteGlobalButton projetos={allProjetos} />
          </>
        }
      />

      <div className="chips" style={{ justifyContent: "flex-end" }}>
        <Link href={toggleFeitasUrl} className={cn("chip", showFeitas && "on")}>
          Mostrar feitos
        </Link>
      </div>

      <LembretesPorProjeto
        lembretes={allLembretes}
        projetos={allProjetos}
        filter={filter}
        showFeitas={showFeitas}
      />
    </>
  );
}
