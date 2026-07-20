import Link from "next/link";
import { FolderKanban, List } from "lucide-react";
import { requirePainelSession } from "@/lib/painel-auth";
import { getAllProjetos } from "@/lib/mongodb/projetos";
import { getAllClientes } from "@/lib/mongodb/clientes";
import { applyFilters } from "@/lib/filter-projetos";
import { Topbar } from "@/components/painel/Topbar";
import { KanbanBoard, ProjetosTable } from "@/components/painel/KanbanBoard";
import { NovoProjetoButton } from "@/components/painel/NovoProjetoButton";
import { PROJETO_STATUS, PROJETO_TIPO, isProjetoAtivo, type ProjetoStatus, type ProjetoTipo } from "@/types/projeto";
import { SERVICO_SLUG, type ServicoSlug } from "@/types/servico";

export const dynamic = "force-dynamic";

type View = "kanban" | "lista";

/** Labels curtos dos chips de categoria (protótipo: Assistência / Web & Digital / Software). */
const CHIP_LABEL: Record<ServicoSlug, string> = {
  "assistencia-tecnica": "Assistência",
  "web-digital": "Web & Digital",
  "software-recuperacao": "Software",
};

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
  await requirePainelSession();

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
        crumbs={["Projectos"]}
        titleHtml={`Projectos · <em>${activos} activos</em>`}
        actions={
          <>
            <div className="view-tabs">
              <Link
                href={buildHref(base, { view: undefined })}
                className={view === "kanban" ? "on" : undefined}
              >
                <FolderKanban className="ic" aria-hidden="true" /> Kanban
              </Link>
              <Link
                href={buildHref(base, { view: "lista" })}
                className={view === "lista" ? "on" : undefined}
              >
                <List className="ic" aria-hidden="true" /> Lista
              </Link>
            </div>
            <NovoProjetoButton clientes={clientes} />
          </>
        }
      />

      <div className="chips">
        <Link
          href={buildHref(base, { categoria: undefined })}
          className={"chip" + (!categoriaParam ? " on" : "")}
        >
          Todas
        </Link>
        {SERVICO_SLUG.map((slug) => (
          <Link
            key={slug}
            href={buildHref(base, { categoria: categoriaParam === slug ? undefined : slug })}
            className={"chip" + (categoriaParam === slug ? " on" : "")}
          >
            {CHIP_LABEL[slug]}
          </Link>
        ))}
      </div>

      {view === "kanban" ? <KanbanBoard projetos={projetos} /> : <ProjetosTable projetos={projetos} />}
    </>
  );
}
