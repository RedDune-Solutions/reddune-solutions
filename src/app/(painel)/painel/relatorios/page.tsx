import Link from "next/link";
import { getAllProjetos } from "@/lib/mongodb/projetos";
import { getAllClientes } from "@/lib/mongodb/clientes";
import { getAllPagamentos } from "@/lib/mongodb/pagamentos";
import { getAllDespesas } from "@/lib/mongodb/despesas";
import { Topbar } from "@/components/painel/Topbar";
import { GastosLog, type GastoFiltro } from "@/components/painel/GastosLog";
import { DespesaFormSheet } from "@/components/painel/DespesaFormSheet";
import { DualLineChart } from "@/components/painel/DualLineChart";
import { STATUS_GROUPS, TIPO_TO_CATEGORIA } from "@/types/projeto";
import { DESPESA_CATEGORIA_LABEL, DESPESA_CATEGORIA_ORDER } from "@/types/despesa";
import type { Pagamento } from "@/types/pagamento";
import { collectGastos, sumGastosInMonth, gastosByCategoria, sortGastosDesc } from "@/lib/gastos";
import { todayLisbonDate } from "@/lib/dates";
import { requirePainelSession } from "@/lib/painel-auth";

export const dynamic = "force-dynamic";

const MES_ABBR = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function fmtEuro(v: number): string {
  return `${Math.round(v).toLocaleString("pt-PT")} €`;
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ g?: string }>;
}) {
  await requirePainelSession();

  const [projetos, clientes, pagamentos, despesas, params] = await Promise.all([
    getAllProjetos(),
    getAllClientes(),
    getAllPagamentos(),
    getAllDespesas(),
    searchParams,
  ]);

  const clienteNome = new Map(clientes.map((c) => [c.id, c.nome]));
  // Ancorado ao dia de Lisboa para o "mês corrente" não deslizar em UTC.
  const now = todayLisbonDate();

  // Últimos 7 meses (mais antigo → actual) para os gráficos.
  const months7: { key: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months7.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: MES_ABBR[d.getMonth()] });
  }
  const currentKey = months7[months7.length - 1].key;

  // Receita mensal (pagamentos)
  const receitaPorMes = new Map<string, number>();
  for (const pg of pagamentos as Pagamento[]) {
    if (!pg.data) continue;
    receitaPorMes.set(monthKey(pg.data), (receitaPorMes.get(monthKey(pg.data)) ?? 0) + pg.valor);
  }

  // Gastos: linhas de projecto marcadas `gastoEmpresa` + despesas manuais
  const gastoEvents = collectGastos(projetos, despesas);
  const gastosPorMes = months7.map((m) => sumGastosInMonth(gastoEvents, m.key));

  const dualData = months7.map((m, i) => ({
    l: m.label,
    rec: Math.round(receitaPorMes.get(m.key) ?? 0),
    gas: Math.round(gastosPorMes[i]),
  }));

  // KPIs do mês corrente: Receita → Gastos → Lucro
  const receitaMes = receitaPorMes.get(currentKey) ?? 0;
  const gastosMes = gastosPorMes[gastosPorMes.length - 1];
  const lucroMes = receitaMes - gastosMes;

  // Gastos por categoria (mês corrente) — 6 baldes, largura % do máximo
  const catTotais = gastosByCategoria(gastoEvents, new Set([currentKey]));
  const catRows = DESPESA_CATEGORIA_ORDER.map((c) => ({ c, v: catTotais[c] }));
  const catMax = Math.max(1, ...catRows.map((r) => r.v));
  const temGastosMes = catRows.some((r) => r.v > 0);

  // Barras empilhadas: contagem de projectos por categoria em cada mês
  const mbarCounts = new Map<string, { web: number; assist: number; soft: number }>();
  for (const m of months7) mbarCounts.set(m.key, { web: 0, assist: 0, soft: 0 });
  for (const p of projetos) {
    if (!p.dataCriado) continue;
    const slot = mbarCounts.get(monthKey(p.dataCriado));
    if (!slot) continue;
    const cat = p.categoria ?? (p.tipo ? TIPO_TO_CATEGORIA[p.tipo] : null);
    if (cat === "web-digital") slot.web += 1;
    else if (cat === "assistencia-tecnica") slot.assist += 1;
    else if (cat === "software-recuperacao") slot.soft += 1;
  }
  const EMPTY_SLOT = { web: 0, assist: 0, soft: 0 };
  const mbarMax = Math.max(1, ...months7.map((m) => {
    const s = mbarCounts.get(m.key) ?? EMPTY_SLOT;
    return s.web + s.assist + s.soft;
  }));
  // Altura por unidade: escala ao mês mais cheio, com tecto para poucos projectos.
  const hpu = Math.min(40, 150 / mbarMax);
  const mbarData = months7.map((m) => {
    const s = mbarCounts.get(m.key) ?? EMPTY_SLOT;
    // Ordem no DOM = de baixo para cima (.stack é column-reverse): Web, Assistência, Software.
    const segs = [
      { k: "web", n: s.web, color: "var(--ember)" },
      { k: "assist", n: s.assist, color: "var(--apricot)" },
      { k: "soft", n: s.soft, color: "var(--dune)" },
    ].map((seg) => ({ ...seg, h: Math.round(seg.n * hpu) }));
    return { key: m.key, l: m.label, total: s.web + s.assist + s.soft, segs };
  });

  // Donut: pipeline actual (cores do protótipo, linhas 764-769)
  const donut = [
    { l: "Em curso", v: projetos.filter((p) => STATUS_GROUPS.ativo.includes(p.status)).length, c: "var(--ember)" },
    { l: "Próximos", v: projetos.filter((p) => STATUS_GROUPS.proximo.includes(p.status)).length, c: "var(--apricot)" },
    { l: "A aguardar", v: projetos.filter((p) => STATUS_GROUPS.aguarda.includes(p.status)).length, c: "#c89b6a" },
    { l: "Finalizado", v: projetos.filter((p) => STATUS_GROUPS.pronto.includes(p.status)).length, c: "var(--dune)" },
  ];
  const donutTotal = donut.reduce((s, d) => s + d.v, 0);
  const donutVisiveis = donut.filter((d) => d.v > 0);
  let donutAcc = 0;
  const donutStops = donutVisiveis.map((d, i) => {
    const from = donutAcc;
    donutAcc = i === donutVisiveis.length - 1 ? 100 : donutAcc + (d.v / donutTotal) * 100;
    return `${d.c} ${from}% ${donutAcc}%`;
  });
  const donutBg =
    donutTotal > 0 ? `conic-gradient(${donutStops.join(", ")})` : "conic-gradient(rgba(90,14,14,.08) 0% 100%)";

  // Top clientes por valor pago — todo o histórico (rótulo do card diz "todo o histórico").
  const pagoPorCliente = new Map<string, number>();
  for (const pg of pagamentos as Pagamento[]) {
    if (!pg.clienteId || !pg.data) continue;
    pagoPorCliente.set(pg.clienteId, (pagoPorCliente.get(pg.clienteId) ?? 0) + pg.valor);
  }
  const topClientes = [...pagoPorCliente.entries()]
    .map(([id, v]) => ({ id, nome: clienteNome.get(id) ?? "(sem nome)", v }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 5);
  const topMax = Math.max(1, ...topClientes.map((x) => x.v));

  // Opções de projecto para o form de despesas (mais recentes primeiro).
  const projetoOptions = [...projetos]
    .sort((a, b) => (b.dataCriado ?? "").localeCompare(a.dataCriado ?? ""))
    .map((p) => ({ id: p.id, titulo: p.titulo }));

  // Log completo: despesas manuais + linhas de projecto marcadas gastoEmpresa.
  const filtro: GastoFiltro =
    params.g === "linha" || params.g === "manual" ? (params.g as GastoFiltro) : "todos";
  const logTodos = sortGastosDesc(gastoEvents);
  const logVisivel = filtro === "todos" ? logTodos : logTodos.filter((e) => e.fonte === filtro);
  const logTotal = logVisivel.reduce((s, e) => s + e.valor, 0);
  const nLinha = logTodos.filter((e) => e.fonte === "linha").length;
  const nManual = logTodos.length - nLinha;

  return (
    <>
      <Topbar
        crumbs={["Relatórios"]}
        titleHtml="Relatórios"
        actions={<DespesaFormSheet projetos={projetoOptions} />}
      />

      {/* Pipeline actual + Top clientes */}
      <div className="rep-grid">
        <div className="card">
          <div className="card-head"><span className="card-title">Pipeline actual</span></div>
          <div className="donut" style={{ background: donutBg }}>
            <div className="donut-c"><b>{donutTotal}</b><span>projectos</span></div>
          </div>
          <div className="legend">
            {donut.map((d) => (
              <div key={d.l} className="lg">
                <span className="sw" style={{ background: d.c }} />{d.l} <b>{d.v}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><span className="card-title">Top clientes</span><span className="kpi-label">todo o histórico</span></div>
          {topClientes.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>Sem pagamentos registados.</p>
          ) : (
            topClientes.map((x) => (
              <div key={x.id} className="bar-row">
                <div className="bl">
                  <Link href={`/painel/clientes/${x.id}`} style={{ color: "inherit" }} className="hover:text-ember">{x.nome}</Link>
                  <b>{fmtEuro(x.v)}</b>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.max(4, Math.round((x.v / topMax) * 100))}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* KPIs do mês: Receita / Gastos / Lucro */}
      <div className="mini-kpis" style={{ marginTop: 16 }}>
        <div className="k"><div className="kpi-label">Receita · este mês</div><div className="kpi-num">{fmtEuro(receitaMes)}</div></div>
        <div className="k"><div className="kpi-label">Gastos · este mês</div><div className="kpi-num" style={{ color: "var(--ember)" }}>{fmtEuro(gastosMes)}</div></div>
        <div className="k accent"><div className="kpi-label">Lucro · este mês</div><div className="kpi-num">{fmtEuro(lucroMes)}</div></div>
      </div>

      {/* Receita vs Gastos */}
      <div className="card chart-card" style={{ marginTop: 16 }}>
        <div className="card-head"><span className="card-title">Receita vs Gastos</span><span className="kpi-label">últimos 7 meses</span></div>
        <DualLineChart data={dualData} />
        <div className="mlegend" style={{ marginTop: 6 }}>
          <div className="lg"><span className="sw" style={{ background: "#d6422a" }} />Receita</div>
          <div className="lg"><span className="sw" style={{ background: "#b0793f" }} />Gastos</div>
        </div>
      </div>

      {/* Gastos por categoria */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head">
          <span className="card-title">Gastos por categoria</span>
          <span className="kpi-label">este mês · {fmtEuro(gastosMes)}</span>
        </div>
        {!temGastosMes ? (
          <p className="muted" style={{ fontSize: 13 }}>
            Sem gastos registados este mês — marca linhas &quot;gasto da empresa&quot; nos projectos ou regista uma despesa.
          </p>
        ) : (
          catRows.map((r) => (
            <div key={r.c} className="bar-row">
              <div className="bl">
                {DESPESA_CATEGORIA_LABEL[r.c]} <b>{r.v.toLocaleString("pt-PT", { maximumFractionDigits: 2 })} €</b>
              </div>
              <div className="bar-track">
                <div className="bar-fill exp" style={{ width: r.v > 0 ? `${Math.max(4, Math.round((r.v / catMax) * 100))}%` : 0 }} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Projectos por categoria · por mês */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head">
          <span className="card-title">Projectos por categoria · por mês</span>
          <span className="kpi-label">últimos 7 meses</span>
        </div>
        <div className="mbars">
          {mbarData.map((m) => (
            <div key={m.key} className="mbar">
              <div className={m.total === 0 ? "stack empty-stack" : "stack"}>
                {m.segs.map((s) =>
                  s.n > 0 ? (
                    <div key={s.k} className="seg" style={{ height: s.h, background: s.color }}>
                      {s.h >= 18 && <b>{s.n}</b>}
                    </div>
                  ) : null
                )}
              </div>
              <span className="ml">{m.l}</span>
            </div>
          ))}
        </div>
        <div className="mlegend">
          <div className="lg"><span className="sw" style={{ background: "var(--ember)" }} />Web &amp; Digital</div>
          <div className="lg"><span className="sw" style={{ background: "var(--apricot)" }} />Assistência</div>
          <div className="lg"><span className="sw" style={{ background: "var(--dune)" }} />Software</div>
        </div>
      </div>

      {/* Log de gastos — todas as fontes (manuais + linhas de projecto) */}
      <div style={{ marginTop: 22 }}>
        <div className="card-head">
          <span className="card-title">Log de gastos</span>
          <span className="kpi-label">
            {logVisivel.length} {logVisivel.length === 1 ? "registo" : "registos"} · {fmtEuro(logTotal)}
          </span>
        </div>
        <div style={{ marginBottom: 14 }}>
          <nav className="view-tabs" aria-label="Filtrar gastos por origem">
            <GastoTab g="todos" cur={filtro} label="Todos" n={logTodos.length} />
            <GastoTab g="linha" cur={filtro} label="De projectos" n={nLinha} />
            <GastoTab g="manual" cur={filtro} label="Manuais" n={nManual} />
          </nav>
        </div>
        <GastosLog events={logVisivel} projetos={projetoOptions} filtro={filtro} />
      </div>
    </>
  );
}

function GastoTab({ g, cur, label, n }: { g: GastoFiltro; cur: GastoFiltro; label: string; n: number }) {
  const href = g === "todos" ? "/painel/relatorios" : `/painel/relatorios?g=${g}`;
  return (
    <Link
      href={href}
      scroll={false}
      className={cur === g ? "on" : undefined}
      aria-current={cur === g ? "true" : undefined}
    >
      {label}
      <span className="num">{n}</span>
    </Link>
  );
}
