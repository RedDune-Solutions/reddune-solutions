import Link from "next/link";
import { Search, Folder } from "lucide-react";
import { getAllProjetos } from "@/lib/mongodb/projetos";
import { getAllClientes } from "@/lib/mongodb/clientes";
import { applyFilters } from "@/lib/filter-projetos";
import { Topbar } from "@/components/painel/Topbar";
import { KanbanBoard } from "@/components/painel/KanbanBoard";
import { TarefasTable } from "@/components/painel/TarefasTable";
import { NovaTarefaButton } from "@/components/painel/NovaTarefaButton";
import { PROJETO_STATUS, PROJETO_TIPO, isProjetoAtivo, type ProjetoStatus, type ProjetoTipo } from "@/types/projeto";
import { SERVICO_SLUG, SERVICO_SLUG_LABEL, type ServicoSlug } from "@/types/servico";

export const dynamic = "force-dynamic";

type View = "kanban" | "lista";

type SearchParams = Promise<{
  view?: string;
  status?: string;
  categoria?: string;
  tipo?: string;
  cliente?: string;
  q?: string;
}>;

function buildHref(base: Record<string, string | undefined>, patch: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  const merged = { ...base, ...patch };
  for (const [k, v] of Object.entries(merged)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `/painel/projetos?${qs}` : "/painel/projetos";
}

export default async function ProjetosPage({ searchParams }: { searchParams: SearchParams }) {
  const [allProjetos, clientes, params] = await Promise.all([
    getAllProjetos(),
    getAllClientes(),
    searchParams,
  ]);

  const view: View = params.view === "lista" ? "lista" : "kanban";

  const statusParam =
    params.status && PROJETO_STATUS.includes(params.status as ProjetoStatus)
      ? (params.status as ProjetoStatus)
      : undefined;
  const tipoParam =
    params.tipo && PROJETO_TIPO.includes(params.tipo as ProjetoTipo)
      ? (params.tipo as ProjetoTipo)
      : undefined;
  const categoriaParam =
    params.categoria && (SERVICO_SLUG as readonly string[]).includes(params.categoria)
      ? (params.categoria as ServicoSlug)
      : undefined;

  const projetos = applyFilters(allProjetos, {
    status: statusParam,
    categoria: categoriaParam,
    tipo: tipoParam,
    clienteNome: params.cliente,
    q: params.q,
  });

  // base query (preserve everything except the param being toggled)
  const base: Record<string, string | undefined> = {
    view: params.view,
    status: statusParam,
    categoria: categoriaParam,
    tipo: tipoParam,
    cliente: params.cliente,
    q: params.q,
  };

  // "Activo" = fonte única isProjetoAtivo (bate certo com o badge da sidebar).
  const activos = allProjetos.filter((p) => isProjetoAtivo(p.status)).length;

  return (
    <>
      <Topbar
        crumbs={["Painel", "Projectos"]}
        titleHtml={`Projectos · <em>${activos}</em> activos`}
        description="Estado e organização do trabalho."
        actions={<NovaTarefaButton clientes={clientes} />}
      />

      <div className="content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div className="tabs">
            <Link href={buildHref(base, { view: undefined })} className={view === "kanban" ? "active" : undefined}>
              Kanban
            </Link>
            <Link href={buildHref(base, { view: "lista" })} className={view === "lista" ? "active" : undefined}>
              Lista <span className="num">{projetos.length}</span>
            </Link>
          </div>

          <div className="filterbar" style={{ flex: 1, maxWidth: 720 }}>
            <Link href={buildHref(base, { categoria: undefined })} className={"chip" + (!categoriaParam ? " active" : "")}>
              <Folder className="ic" aria-hidden="true" /> Todas
              {!categoriaParam && <span className="x">×</span>}
            </Link>
            {SERVICO_SLUG.map((slug) => (
              <Link
                key={slug}
                href={buildHref(base, { categoria: categoriaParam === slug ? undefined : slug })}
                className={"chip" + (categoriaParam === slug ? " active" : "")}
              >
                {SERVICO_SLUG_LABEL[slug]}
                {categoriaParam === slug && <span className="x">×</span>}
              </Link>
            ))}
            <form action="/painel/projetos" className="search-mini">
              {params.view && <input type="hidden" name="view" value={params.view} />}
              {categoriaParam && <input type="hidden" name="categoria" value={categoriaParam} />}
              <Search className="ic" aria-hidden="true" />
              <input name="q" defaultValue={params.q ?? ""} placeholder="Procurar projecto, cliente, ID…" />
            </form>
          </div>
        </div>

        {view === "kanban" ? <KanbanBoard projetos={projetos} /> : <TarefasTable projetos={projetos} />}
      </div>
    </>
  );
}
