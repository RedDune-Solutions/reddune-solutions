import type { ReactNode } from "react";
import Link from "next/link";
import { Search, FolderKanban, Users, ListChecks } from "lucide-react";
import { requirePainelSession } from "@/lib/painel-auth";
import { getAllProjetos } from "@/lib/mongodb/projetos";
import { getAllClientes } from "@/lib/mongodb/clientes";
import { getAllLembretes } from "@/lib/mongodb/lembretes";
import { Topbar } from "@/components/painel/Topbar";
import { matchAll, normPesquisa } from "@/lib/procurar";
import { STATUS_LABELS } from "@/types/projeto";
import { isToday, isOverdue } from "@/lib/dates";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string }>;

function fmtPrazo(prazo: string | null, feita: boolean): string {
  if (feita) return "feito";
  if (!prazo) return "sem prazo";
  if (isToday(prazo)) return "hoje";
  if (isOverdue(prazo)) return "atrasado";
  try {
    return new Date(prazo).toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
  } catch {
    return prazo;
  }
}

/** Caixa de pesquisa grande do protótipo — form GET real para ?q=. */
function SearchBig({ defaultValue }: { defaultValue: string }) {
  return (
    <form method="get" action="/painel/procurar" role="search" className="search-big">
      <Search className="ic" style={{ width: 19, height: 19, color: "var(--ink-mute)" }} aria-hidden="true" />
      <input
        name="q"
        defaultValue={defaultValue}
        placeholder="Projectos, clientes, lembretes…"
        aria-label="Procurar projectos, clientes e lembretes"
        autoFocus
        autoComplete="off"
      />
    </form>
  );
}

export default async function ProcurarPage({ searchParams }: { searchParams: SearchParams }) {
  await requirePainelSession();

  const params = await searchParams;
  const raw = (params.q ?? "").trim();
  const q = normPesquisa(raw);

  // Estado inicial: sem termo, não consultamos a BD.
  if (!q) {
    return (
      <>
        <Topbar crumbs={["Procurar"]} titleHtml="Procurar" searchDefault={raw} />
        <SearchBig defaultValue={raw} />
      </>
    );
  }

  const [projetos, clientes, lembretes] = await Promise.all([
    getAllProjetos(),
    getAllClientes(),
    getAllLembretes(),
  ]);

  const {
    projetos: projetosHit,
    clientes: clientesHit,
    lembretes: lembretesHit,
  } = matchAll(raw, projetos, clientes, lembretes);

  // Contexto por resultado: projecto do lembrete; primeiro projecto do cliente.
  const projetoById = new Map(projetos.map((p) => [p.id, p]));
  const projetoDoCliente = new Map<string, string>();
  for (const p of projetos) {
    if (p.clienteId && !projetoDoCliente.has(p.clienteId)) projetoDoCliente.set(p.clienteId, p.titulo);
  }

  const total = projetosHit.length + clientesHit.length + lembretesHit.length;

  // Grupos com resultados, pela ordem do protótipo: Projectos → Clientes → Lembretes.
  const grupos: { titulo: string; rows: ReactNode[] }[] = [];

  if (projetosHit.length > 0) {
    grupos.push({
      titulo: "Projectos",
      rows: projetosHit.map((p) => (
        <Link key={p.id} href={`/painel/projetos/${p.id}`} className="res">
          <span className="r-ic"><FolderKanban className="ic" aria-hidden="true" /></span>
          <div><b>{p.titulo}</b> · {p.clienteNome ?? "Interno"}</div>
          <span className="muted">{STATUS_LABELS[p.status] ?? p.status}</span>
        </Link>
      )),
    });
  }

  if (clientesHit.length > 0) {
    grupos.push({
      titulo: "Clientes",
      rows: clientesHit.map((c) => (
        <Link key={c.id} href={`/painel/clientes/${c.id}`} className="res">
          <span className="r-ic"><Users className="ic" aria-hidden="true" /></span>
          <div><b>{c.nome}</b> · {projetoDoCliente.get(c.id) ?? "sem projectos"}</div>
          <span className="muted">{c.telefone ?? c.email ?? (c.nif ? `NIF ${c.nif}` : "—")}</span>
        </Link>
      )),
    });
  }

  if (lembretesHit.length > 0) {
    grupos.push({
      titulo: "Lembretes",
      rows: lembretesHit.map((t) => {
        const proj = projetoById.get(t.projetoId);
        return (
          <Link key={t.id} href={`/painel/projetos/${t.projetoId}`} className="res">
            <span className="r-ic"><ListChecks className="ic" aria-hidden="true" /></span>
            <div>
              <b style={t.feita ? { textDecoration: "line-through", opacity: 0.6 } : undefined}>{t.titulo}</b>
              {" · "}
              {proj ? proj.titulo : "Projecto desconhecido"}
            </div>
            <span className="muted">{fmtPrazo(t.prazo, t.feita)}</span>
          </Link>
        );
      }),
    });
  }

  return (
    <>
      <Topbar crumbs={["Procurar"]} titleHtml="Procurar" searchDefault={raw} />

      <SearchBig defaultValue={raw} />

      {total === 0 ? (
        <div className="empty">
          <div className="t">Sem resultados para &ldquo;{raw}&rdquo;</div>
          <div className="desc">Tenta outro termo — nome, NIF, telefone, email ou parte do título.</div>
        </div>
      ) : (
        grupos.map((g, i) => (
          <div key={g.titulo}>
            <p className="res-group" style={i > 0 ? { marginTop: 16 } : undefined}>{g.titulo}</p>
            {g.rows}
          </div>
        ))
      )}
    </>
  );
}
