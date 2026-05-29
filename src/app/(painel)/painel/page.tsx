import Link from "next/link";
import {
  Play,
  Inbox,
  Clock,
  Check,
  Users,
  Coins,
  AlertTriangle,
  AlertCircle,
  Sun,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { getAllProjetos } from "@/lib/mongodb/projetos";
import { getAllClientes } from "@/lib/mongodb/clientes";
import { getAllPagamentos } from "@/lib/mongodb/pagamentos";
import { getRecentAuditEntries, type AuditEntry } from "@/lib/mongodb/mutation-audit";
import { Topbar } from "@/components/painel/Topbar";
import { KpiCard } from "@/components/painel/KpiCard";
import { TarefaCard } from "@/components/painel/TarefaCard";
import { NovaTarefaButton } from "@/components/painel/NovaTarefaButton";
import { STATUS_GROUPS, type Projeto } from "@/types/projeto";
import { isOverdue, isToday, parseIsoDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

const COLL_LABEL: Record<string, string> = {
  projetos: "Projecto",
  clientes: "Cliente",
  tarefas: "Tarefa",
  pagamentos: "Pagamento",
  products: "Produto",
  portfolio: "Trabalho",
  servicos: "Serviço",
};
const OP_LABEL: Record<string, string> = { create: "criou", update: "editou", delete: "apagou" };
const OP_ACT: Record<string, string> = { create: "create", update: "edit", delete: "delete" };

function greeting(d: Date): string {
  const h = d.getHours();
  if (h < 12) return "Bom dia";
  if (h < 20) return "Boa tarde";
  return "Boa noite";
}

function fmtDay(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
  } catch {
    return "—";
  }
}

function fmtRel(d: Date): string {
  const diff = Date.now() - new Date(d).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h}h`;
  return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

function auditObj(e: AuditEntry): string {
  const after = e.after as { titulo?: string; nome?: string; name?: unknown } | null;
  if (after?.titulo) return after.titulo;
  if (after?.nome) return after.nome;
  return `${COLL_LABEL[e.collection] ?? e.collection} · ${e.entityId.slice(0, 8)}`;
}

export default async function PainelOverviewPage() {
  const [projetos, clientes, pagamentos, audit] = await Promise.all([
    getAllProjetos(),
    getAllClientes(),
    getAllPagamentos(),
    getRecentAuditEntries(6),
  ]);

  const now = new Date();

  const pagoPorProjeto = new Map<string, number>();
  for (const p of pagamentos) {
    pagoPorProjeto.set(p.projetoId, (pagoPorProjeto.get(p.projetoId) ?? 0) + p.valor);
  }

  const dividas = projetos.filter(
    (p) =>
      p.status === "terminado" &&
      p.valorEstimado != null &&
      (pagoPorProjeto.get(p.id) ?? 0) < p.valorEstimado
  );
  const dividasValor = dividas.reduce(
    (sum, p) => sum + ((p.valorEstimado ?? 0) - (pagoPorProjeto.get(p.id) ?? 0)),
    0
  );
  const emAtrasoLongo = projetos.filter((p) => {
    if (p.status !== "terminado" || !p.dataFechado) return false;
    const days = (Date.now() - new Date(p.dataFechado).getTime()) / 86400000;
    return days > 30 && (p.valorEstimado ?? 0) > (pagoPorProjeto.get(p.id) ?? 0);
  });

  const counts = {
    total: projetos.length,
    emCurso: projetos.filter((p) => STATUS_GROUPS.ativo.includes(p.status)).length,
    proximos: projetos.filter((p) => STATUS_GROUPS.proximo.includes(p.status)).length,
    aguarda: projetos.filter((p) => STATUS_GROUPS.aguarda.includes(p.status)).length,
    pronto: projetos.filter((p) => STATUS_GROUPS.pronto.includes(p.status)).length,
  };

  // "Hoje" widget: active projects overdue or due today.
  const active = projetos.filter(
    (p) =>
      STATUS_GROUPS.ativo.includes(p.status) ||
      STATUS_GROUPS.proximo.includes(p.status) ||
      STATUS_GROUPS.aguarda.includes(p.status)
  );
  const hojeItems = active
    .filter((p) => p.prazo && (isOverdue(p.prazo, now) || isToday(p.prazo, now)))
    .sort((a, b) => {
      const ad = parseIsoDate(a.prazo ?? null);
      const bd = parseIsoDate(b.prazo ?? null);
      return (ad?.getTime() ?? 0) - (bd?.getTime() ?? 0);
    })
    .slice(0, 5);

  const proximaAccaoProjetos = projetos
    .filter(
      (p) =>
        STATUS_GROUPS.ativo.includes(p.status) || STATUS_GROUPS.proximo.includes(p.status)
    )
    .filter((p) => p.proximaAccao && p.proximaAccao.length > 0)
    .slice(0, 6);

  const mesActual = now.toISOString().slice(0, 7);
  const ganhosMes = pagamentos
    .filter((p) => p.data?.startsWith(mesActual))
    .reduce((s, p) => s + p.valor, 0);

  const dataLabel = now.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (projetos.length === 0) {
    return (
      <>
        <Topbar crumbs={["Painel", "Visão geral"]} title="Visão geral" />
        <div className="content">
          <div className="empty">
            <div className="ic">
              <AlertCircle aria-hidden="true" />
            </div>
            <div className="t">Sem dados ainda</div>
            <div className="desc">
              Vai a <strong>Projectos</strong> e cria o primeiro projecto.
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        crumbs={["Painel", "Visão geral"]}
        titleHtml={`${greeting(now)}, <em>Equipa</em>.`}
        description={`${dataLabel} · ${counts.emCurso} em curso · ${counts.proximos} próximos · ${dividas.length} em dívida.`}
        actions={<NovaTarefaButton clientes={clientes} />}
      />

      <div className="content">
        {/* Today widget + primary KPIs */}
        <div className="ov-top">
          <div className="kpi ink" style={{ minHeight: 0 }}>
            <div className="row between">
              <div className="label">Hoje · {fmtDay(now.toISOString())}</div>
              <Sun size={20} style={{ color: "var(--apricot)" }} aria-hidden="true" />
            </div>
            <div className="v" style={{ fontSize: 30, lineHeight: 1.05 }}>
              {hojeItems.length}{" "}
              <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--apricot)", fontWeight: 500 }}>
                {hojeItems.length === 1 ? "prazo" : "prazos"}
              </span>
            </div>
            <div className="col" style={{ gap: 0, marginTop: 4 }}>
              {hojeItems.length === 0 ? (
                <span style={{ fontSize: 13, color: "#c89b6a" }}>Nada urgente hoje.</span>
              ) : (
                hojeItems.map((p) => (
                  <Link
                    key={p.id}
                    href={`/painel/projetos/${p.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 0",
                      borderTop: "1px dashed rgba(245, 233, 211, 0.12)",
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--apricot)", width: 52 }}>
                      {fmtDay(p.prazo)}
                    </span>
                    <span style={{ fontSize: 13, color: "#f5e9d3", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.titulo}
                    </span>
                    <ChevronRight size={13} style={{ color: "#6a4f3e" }} aria-hidden="true" />
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <KpiCard tone="accent" label="Em curso" value={counts.emCurso} icon={Play} hint={`${counts.total} no total`} />
            <KpiCard label="Próximos" value={counts.proximos} icon={Inbox} hint="na fila — priorizar" />
            <KpiCard tone="amber" label="Em espera" value={counts.aguarda} icon={Clock} hint="aguarda cliente ou encomenda" />
            <KpiCard tone="green" label="Prontos" value={counts.pronto} icon={Check} hint="aguardam entrega · pagamento" />
          </div>
        </div>

        {/* Clients & money */}
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <KpiCard label="Clientes" value={clientes.length} icon={Users} hint="total de fichas" />
          <KpiCard
            tone="amber"
            label="Em dívida"
            value={dividasValor > 0 ? Math.round(dividasValor).toLocaleString("pt-PT") : "0"}
            unit="€"
            icon={Coins}
            hint={`${dividas.length} projecto${dividas.length === 1 ? "" : "s"} por cobrar`}
          />
          <KpiCard
            tone="accent"
            label="Em atraso 30+ dias"
            value={emAtrasoLongo.length}
            icon={AlertTriangle}
            hint={'terminados há +30 dias · <a class="ember" href="/painel/dividas" style="text-decoration:underline">ver dívidas</a>'}
          />
        </div>

        {/* Foco da semana */}
        <div className="col" style={{ gap: 14 }}>
          <div className="section-h">
            <div>
              <div className="eye">Próximas acções</div>
              <div className="t">
                Foco da <em className="italic">semana</em>
              </div>
            </div>
            <Link className="more" href="/painel/projetos?view=kanban">
              Ver Kanban <ArrowRight className="ic" aria-hidden="true" />
            </Link>
          </div>
          {proximaAccaoProjetos.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>Sem próximas acções activas. Tudo em dia.</p>
          ) : (
            <div className="ov-cards">
              {proximaAccaoProjetos.map((p) => (
                <TarefaCard key={p.id} projeto={p} />
              ))}
            </div>
          )}
        </div>

        {/* Activity + month */}
        <div className="ov-bottom">
          <div className="card">
            <div className="ch">
              <div>
                <div className="t">Atividade recente</div>
                <div className="sub">Últimas mutações registadas</div>
              </div>
              <Link className="btn ghost tiny" href="/painel/auditoria">Ver tudo</Link>
            </div>
            <div className="cb" style={{ padding: 0 }}>
              {audit.length === 0 ? (
                <p className="muted" style={{ fontSize: 13, padding: "16px 20px" }}>Sem atividade ainda.</p>
              ) : (
                audit.map((e, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: 14,
                      alignItems: "center",
                      padding: "12px 20px",
                      borderBottom: "1px dashed rgba(90, 14, 14, 0.10)",
                      fontSize: 13,
                    }}
                  >
                    <div className="av-c sm b">{(e.userEmail ?? "?").slice(0, 1).toUpperCase()}</div>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ color: "var(--ink-soft)" }}>
                        {(e.userEmail ?? "Sistema").split("@")[0]}{" "}
                        <span className={`act ${OP_ACT[e.op] ?? "edit"}`}>{OP_LABEL[e.op] ?? e.op}</span>{" "}
                        <span className="muted">{COLL_LABEL[e.collection] ?? e.collection}</span>{" "}
                      </span>
                      <span style={{ color: "var(--ink)", fontWeight: 500 }}>{auditObj(e)}</span>
                    </div>
                    <span className="mono muted" style={{ fontSize: 11, whiteSpace: "nowrap" }}>{fmtRel(e.at)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <MonthSummary
            mesLabel={now.toLocaleDateString("pt-PT", { month: "long" })}
            recebido={ganhosMes}
            concluidos={projetos.filter((p) => p.dataFechado?.startsWith(mesActual)).length}
            novosClientes={clientes.filter((c) => c.criadoEm?.startsWith(mesActual)).length}
            ticketMedio={(() => {
              const cnt = pagamentos.filter((p) => p.data?.startsWith(mesActual)).length;
              return cnt > 0 ? Math.round(ganhosMes / cnt) : 0;
            })()}
            dist={{
              assist: active.filter((p) => p.categoria === "assistencia-tecnica").length,
              web: active.filter((p) => p.categoria === "web-digital").length,
              recup: active.filter((p) => p.categoria === "software-recuperacao").length,
            }}
          />
        </div>
      </div>
    </>
  );
}

function MonthSummary({
  mesLabel,
  recebido,
  concluidos,
  novosClientes,
  ticketMedio,
  dist,
}: {
  mesLabel: string;
  recebido: number;
  concluidos: number;
  novosClientes: number;
  ticketMedio: number;
  dist: { assist: number; web: number; recup: number };
}) {
  const totalDist = dist.assist + dist.web + dist.recup;
  const eur = (n: number) => Math.round(n).toLocaleString("pt-PT");
  const cap = mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1);

  return (
    <div className="card">
      <div className="ch">
        <div>
          <div className="t">{cap} · até hoje</div>
          <div className="sub">Resumo do mês corrente</div>
        </div>
      </div>
      <div className="cb">
        <div style={{ display: "grid", gap: 12 }}>
          <div className="row between">
            <span className="muted mono" style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase" }}>Recebido</span>
            <span className="ink" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22 }}>
              {eur(recebido)} <span className="mono muted" style={{ fontSize: 14 }}>€</span>
            </span>
          </div>

          <div style={{ height: 1, borderTop: "1px dashed rgba(90, 14, 14, 0.14)", margin: "4px 0" }} />

          <div className="row between">
            <div>
              <div className="muted mono" style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase" }}>Concluídos</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, marginTop: 4 }}>{concluidos}</div>
            </div>
            <div>
              <div className="muted mono" style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase" }}>Novos clientes</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, marginTop: 4 }}>{novosClientes}</div>
            </div>
            <div>
              <div className="muted mono" style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase" }}>Ticket médio</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, marginTop: 4 }}>
                {eur(ticketMedio)} <span className="mono muted" style={{ fontSize: 14 }}>€</span>
              </div>
            </div>
          </div>

          <div style={{ height: 1, borderTop: "1px dashed rgba(90, 14, 14, 0.14)", margin: "4px 0" }} />

          <div>
            <div className="muted mono" style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>Distribuição (activos)</div>
            {totalDist === 0 ? (
              <p className="muted" style={{ fontSize: 12 }}>Sem projectos activos.</p>
            ) : (
              <>
                <div style={{ display: "flex", gap: 4, height: 8, borderRadius: 4, overflow: "hidden" }}>
                  {dist.assist > 0 && <div style={{ flex: dist.assist, background: "var(--ember)" }} />}
                  {dist.web > 0 && <div style={{ flex: dist.web, background: "var(--apricot)" }} />}
                  {dist.recup > 0 && <div style={{ flex: dist.recup, background: "var(--peach)" }} />}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-mute)" }}>
                  <span>Assist. · {dist.assist}</span>
                  <span>Web · {dist.web}</span>
                  <span>Recup. · {dist.recup}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
