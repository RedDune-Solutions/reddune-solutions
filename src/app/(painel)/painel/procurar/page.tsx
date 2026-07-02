import Link from "next/link";
import { Search, Folder, Users, ListChecks, ChevronRight } from "lucide-react";
import { getAllProjetos } from "@/lib/mongodb/projetos";
import { getAllClientes } from "@/lib/mongodb/clientes";
import { getAllTarefas } from "@/lib/mongodb/tarefas";
import { Topbar } from "@/components/painel/Topbar";
import { GlobalSearch } from "@/components/painel/GlobalSearch";
import { StatusBadge } from "@/components/painel/StatusBadge";
import { PROJETO_TIPO_LABEL, type ProjetoTipo, type Projeto } from "@/types/projeto";
import type { Cliente } from "@/types/cliente";
import type { Tarefa } from "@/types/tarefa";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string }>;

/** Lowercase + strip diacritics, para match insensível a acentos. */
function norm(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

const AV = ["a", "b", "c", "d"] as const;
function avFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AV[h % AV.length];
}
function initials(name: string): string {
  return name.split(/\s+/).map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function projetoHaystack(p: Projeto): string {
  const tipos = [p.tipo, ...(p.tipos ?? [])].filter(Boolean) as ProjetoTipo[];
  const tiposLabel = tipos.map((t) => PROJETO_TIPO_LABEL[t] ?? t).join(" ");
  return norm([p.titulo, p.clienteNome ?? "", tipos.join(" "), tiposLabel, p.notasResumo ?? ""].join(" "));
}
function clienteHaystack(c: Cliente): string {
  return norm([c.nome, c.email ?? "", c.telefone ?? "", c.nif ?? ""].join(" "));
}
function tarefaHaystack(t: Tarefa): string {
  return norm([t.titulo, t.notas ?? ""].join(" "));
}

export default async function ProcurarPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const raw = (params.q ?? "").trim();
  const q = norm(raw);

  // Estado inicial: sem termo, não consultamos a BD.
  if (!q) {
    return (
      <>
        <Topbar
          crumbs={["Painel", "Procurar"]}
          titleHtml={`Pesquisa <em>global</em>`}
          description="Projectos, clientes e tarefas num só sítio."
          searchDefault={raw}
        />
        <div className="content">
          <div className="gsearch-page">
            <GlobalSearch defaultValue={raw} />
          </div>
          <div className="empty">
            <div className="ic"><Search aria-hidden="true" /></div>
            <div className="t">Escreve para procurar</div>
            <div className="desc">Pesquisa por nome de projecto, cliente, NIF, telefone, email ou tarefa.</div>
          </div>
        </div>
      </>
    );
  }

  const [projetos, clientes, tarefas] = await Promise.all([
    getAllProjetos(),
    getAllClientes(),
    getAllTarefas(),
  ]);

  const projetosHit = projetos.filter((p) => projetoHaystack(p).includes(q));
  const clientesHit = clientes.filter((c) => clienteHaystack(c).includes(q));
  const tarefasHit = tarefas.filter((t) => tarefaHaystack(t).includes(q));

  // Para cada tarefa, o projeto a que pertence (título + link).
  const projetoById = new Map(projetos.map((p) => [p.id, p]));

  const total = projetosHit.length + clientesHit.length + tarefasHit.length;

  return (
    <>
      <Topbar
        crumbs={["Painel", "Procurar"]}
        titleHtml={`Resultados · <em>${total}</em>`}
        description={`Para “${raw}” — projectos, clientes e tarefas.`}
        searchDefault={raw}
      />

      <div className="content">
        <div className="gsearch-page">
          <GlobalSearch defaultValue={raw} />
        </div>
        {total === 0 ? (
          <div className="empty">
            <div className="ic"><Search aria-hidden="true" /></div>
            <div className="t">Sem resultados para “{raw}”</div>
            <div className="desc">Tenta outro termo — nome, NIF, telefone, email ou parte do título.</div>
          </div>
        ) : (
          <div className="col" style={{ gap: 28 }}>
            {/* PROJECTOS */}
            <section className="col" style={{ gap: 12 }}>
              <div className="section-h">
                <div>
                  <div className="eye">Projectos</div>
                  <div className="t">{projetosHit.length} {projetosHit.length === 1 ? "resultado" : "resultados"}</div>
                </div>
              </div>
              {projetosHit.length === 0 ? (
                <div className="empty">
                  <div className="ic"><Folder aria-hidden="true" /></div>
                  <div className="t">Nenhum projecto</div>
                  <div className="desc">Sem correspondência em título, cliente, tipo ou notas.</div>
                </div>
              ) : (
                <div className="card flat" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table className="tbl">
                      <tbody>
                        {projetosHit.map((p) => {
                          const tipos = [p.tipo, ...(p.tipos ?? [])].filter(Boolean) as ProjetoTipo[];
                          const tipoLabel = tipos.length ? (PROJETO_TIPO_LABEL[tipos[0]] ?? tipos[0]) : null;
                          return (
                            <tr key={p.id}>
                              <td>
                                <Link href={`/painel/projetos/${p.id}`} className="ttl-cell">
                                  {p.titulo}
                                  <span className="sub">
                                    {p.clienteNome ?? "Interno"}
                                    {tipoLabel && ` · ${tipoLabel}`}
                                  </span>
                                </Link>
                              </td>
                              <td className="right" style={{ width: 150 }}>
                                <StatusBadge status={p.status} />
                              </td>
                              <td style={{ width: 44 }}>
                                <Link href={`/painel/projetos/${p.id}`} aria-label="Abrir projecto">
                                  <ChevronRight className="row-menu" aria-hidden="true" />
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            {/* CLIENTES */}
            <section className="col" style={{ gap: 12 }}>
              <div className="section-h">
                <div>
                  <div className="eye">Clientes</div>
                  <div className="t">{clientesHit.length} {clientesHit.length === 1 ? "resultado" : "resultados"}</div>
                </div>
              </div>
              {clientesHit.length === 0 ? (
                <div className="empty">
                  <div className="ic"><Users aria-hidden="true" /></div>
                  <div className="t">Nenhum cliente</div>
                  <div className="desc">Sem correspondência em nome, email, telefone ou NIF.</div>
                </div>
              ) : (
                <div className="card flat" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table className="tbl">
                      <tbody>
                        {clientesHit.map((c) => (
                          <tr key={c.id}>
                            <td>
                              <Link href={`/painel/clientes/${c.id}`} className="row" style={{ gap: 10 }}>
                                <span className={`av-c sm ${avFor(c.nome)}`}>{initials(c.nome)}</span>
                                <span className="ttl-cell">
                                  {c.nome}
                                  {c.nif && <span className="sub mono" style={{ fontSize: 10.5 }}>NIF {c.nif}</span>}
                                </span>
                              </Link>
                            </td>
                            <td className="col-hide-sm" style={{ width: 260 }}>
                              {c.telefone && <div className="mono" style={{ fontSize: 12 }}>{c.telefone}</div>}
                              {c.email && <div className="mono muted" style={{ fontSize: 11 }}>{c.email}</div>}
                              {!c.telefone && !c.email && <span className="muted mono">—</span>}
                            </td>
                            <td style={{ width: 44 }}>
                              <Link href={`/painel/clientes/${c.id}`} aria-label="Abrir ficha">
                                <ChevronRight className="row-menu" aria-hidden="true" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            {/* TAREFAS */}
            <section className="col" style={{ gap: 12 }}>
              <div className="section-h">
                <div>
                  <div className="eye">Tarefas</div>
                  <div className="t">{tarefasHit.length} {tarefasHit.length === 1 ? "resultado" : "resultados"}</div>
                </div>
              </div>
              {tarefasHit.length === 0 ? (
                <div className="empty">
                  <div className="ic"><ListChecks aria-hidden="true" /></div>
                  <div className="t">Nenhuma tarefa</div>
                  <div className="desc">Sem correspondência em título ou notas.</div>
                </div>
              ) : (
                <div className="card flat" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table className="tbl">
                      <tbody>
                        {tarefasHit.map((t) => {
                          const proj = projetoById.get(t.projetoId);
                          const href = `/painel/projetos/${t.projetoId}`;
                          return (
                            <tr key={t.id}>
                              <td>
                                <Link href={href} className="ttl-cell">
                                  <span style={t.feita ? { textDecoration: "line-through", opacity: 0.6 } : undefined}>
                                    {t.titulo}
                                  </span>
                                  <span className="sub">
                                    {proj ? proj.titulo : "Projecto desconhecido"}
                                    {t.feita && " · feita"}
                                  </span>
                                </Link>
                              </td>
                              <td style={{ width: 44 }}>
                                <Link href={href} aria-label="Abrir projecto da tarefa">
                                  <ChevronRight className="row-menu" aria-hidden="true" />
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  );
}
