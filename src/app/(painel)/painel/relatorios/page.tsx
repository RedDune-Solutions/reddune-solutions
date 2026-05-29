import Link from "next/link";
import { Coins, FolderKanban, Receipt, Users } from "lucide-react";
import { getAllProjetos } from "@/lib/mongodb/projetos";
import { getAllClientes } from "@/lib/mongodb/clientes";
import { getAllPagamentos } from "@/lib/mongodb/pagamentos";
import { Topbar } from "@/components/painel/Topbar";
import { KpiCard } from "@/components/painel/KpiCard";
import { STATUS_GROUPS, TIPO_TO_CATEGORIA, type Projeto } from "@/types/projeto";
import type { Pagamento } from "@/types/pagamento";

export const dynamic = "force-dynamic";

const MES_ABBR = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

// ---- SVG charts (ported from Oasis design handoff) ----
function LineChart({ data, h = 220, w = 540 }: { data: { l: string; v: number }[]; h?: number; w?: number }) {
  const max = Math.max(1, ...data.map((d) => d.v)) * 1.1;
  const step = data.length > 1 ? (w - 40) / (data.length - 1) : 0;
  const yScale = (v: number) => h - 32 - (v / max) * (h - 50);
  const pts = data.map((d, i) => `${20 + i * step},${yScale(d.v)}`).join(" ");
  const areaPts = `20,${h - 30} ${pts} ${20 + (data.length - 1) * step},${h - 30}`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {[0, 0.33, 0.66, 1].map((p, i) => (
        <line key={i} x1="20" x2={w - 20} y1={20 + p * (h - 50)} y2={20 + p * (h - 50)} stroke="rgba(90,14,14,0.06)" strokeDasharray="4 4" />
      ))}
      <polygon points={areaPts} fill="rgba(214, 66, 42, 0.10)" />
      <polyline points={pts} fill="none" stroke="var(--ember)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle key={i} cx={20 + i * step} cy={yScale(d.v)} r="3.5" fill="var(--sand-warm)" stroke="var(--ember)" strokeWidth="2" />
      ))}
      {data.map((d, i) => (
        <text key={i} x={20 + i * step} y={h - 10} fill="var(--ink-mute)" fontSize="9.5" fontFamily="var(--font-mono)" letterSpacing="0.08em" textAnchor="middle">{d.l}</text>
      ))}
    </svg>
  );
}

function BarChart({ data, h = 220, w = 540 }: { data: { l: string; a: number; b: number; c: number }[]; h?: number; w?: number }) {
  const max = Math.max(1, ...data.map((d) => d.a + d.b + d.c)) * 1.1;
  const bw = (w - 60) / data.length;
  const groupW = bw * 0.65;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {[0, 0.33, 0.66, 1].map((p, i) => (
        <line key={i} x1="20" x2={w - 20} y1={20 + p * (h - 50)} y2={20 + p * (h - 50)} stroke="rgba(90,14,14,0.06)" strokeDasharray="4 4" />
      ))}
      {data.map((d, i) => {
        const x = 30 + i * bw + (bw - groupW) / 2;
        const aH = (d.a / max) * (h - 50);
        const bH = (d.b / max) * (h - 50);
        const cH = (d.c / max) * (h - 50);
        const y = h - 30;
        return (
          <g key={i}>
            <rect x={x} y={y - aH} width={groupW} height={aH} fill="var(--ember)" />
            <rect x={x} y={y - aH - bH} width={groupW} height={bH} fill="var(--apricot)" />
            <rect x={x} y={y - aH - bH - cH} width={groupW} height={cH} fill="var(--peach)" />
            <text x={x + groupW / 2} y={h - 10} fill="var(--ink-mute)" fontSize="9.5" fontFamily="var(--font-mono)" letterSpacing="0.08em" textAnchor="middle">{d.l}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Donut({ data, size = 180, thick = 22 }: { data: { l: string; v: number; c: string }[]; size?: number; thick?: number }) {
  const total = data.reduce((s, d) => s + d.v, 0);
  const r = size / 2 - thick / 2;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--cream-deep)" strokeWidth={thick} fill="none" />
      {total > 0 && data.map((d, i) => {
        const len = (d.v / total) * C;
        const el = (
          <circle key={i} cx={size / 2} cy={size / 2} r={r} stroke={d.c} strokeWidth={thick} fill="none"
            strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`} strokeLinecap="butt" />
        );
        offset += len;
        return el;
      })}
      <text x={size / 2} y={size / 2 - 4} textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="28" fill="var(--ink)">{total}</text>
      <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="0.18em" fill="var(--ink-mute)">PROJECTOS</text>
    </svg>
  );
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

export default async function RelatoriosPage() {
  const [projetos, clientes, pagamentos] = await Promise.all([
    getAllProjetos(),
    getAllClientes(),
    getAllPagamentos(),
  ]);

  const clienteNome = new Map(clientes.map((c) => [c.id, c.nome]));
  const now = new Date();

  // Last 6 month keys (oldest → newest)
  const monthsKeys: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthsKeys.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: MES_ABBR[d.getMonth()] });
  }

  // Receita mensal (pagamentos)
  const receitaPorMes = new Map<string, number>();
  for (const pg of pagamentos as Pagamento[]) {
    if (!pg.data) continue;
    receitaPorMes.set(monthKey(pg.data), (receitaPorMes.get(monthKey(pg.data)) ?? 0) + pg.valor);
  }
  const lineData = monthsKeys.map((m) => ({ l: m.label, v: Math.round(receitaPorMes.get(m.key) ?? 0) }));
  const receita6m = lineData.reduce((s, d) => s + d.v, 0);

  // Receita semestre anterior (delta)
  let receitaPrev = 0;
  for (const pg of pagamentos as Pagamento[]) {
    if (!pg.data) continue;
    const d = new Date(pg.data);
    const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (diffMonths >= 6 && diffMonths < 12) receitaPrev += pg.valor;
  }
  const receitaDelta = receitaPrev > 0 ? Math.round(((receita6m - receitaPrev) / receitaPrev) * 100) : null;

  // Bars: por mês, contagem por categoria (assist=a, web=b, recup=c)
  const barMap = new Map<string, { a: number; b: number; c: number }>();
  for (const m of monthsKeys) barMap.set(m.key, { a: 0, b: 0, c: 0 });
  for (const p of projetos) {
    if (!p.dataCriado) continue;
    const k = monthKey(p.dataCriado);
    const slot = barMap.get(k);
    if (!slot) continue;
    const cat = p.categoria ?? (p.tipo ? TIPO_TO_CATEGORIA[p.tipo] : null);
    if (cat === "assistencia-tecnica") slot.a += 1;
    else if (cat === "web-digital") slot.b += 1;
    else if (cat === "software-recuperacao") slot.c += 1;
  }
  const barData = monthsKeys.map((m) => ({ l: m.label, ...(barMap.get(m.key) ?? { a: 0, b: 0, c: 0 }) }));

  // Donut: estado actual
  const donut = [
    { l: "Em curso", v: projetos.filter((p) => STATUS_GROUPS.ativo.includes(p.status)).length, c: "var(--ember)" },
    { l: "Próximos", v: projetos.filter((p) => STATUS_GROUPS.proximo.includes(p.status)).length, c: "var(--apricot)" },
    { l: "Em espera", v: projetos.filter((p) => STATUS_GROUPS.aguarda.includes(p.status)).length, c: "#d49027" },
    { l: "Prontos", v: projetos.filter((p) => STATUS_GROUPS.pronto.includes(p.status)).length, c: "#3f6a4d" },
  ];

  // Top clientes por valor pago
  const pagoPorCliente = new Map<string, number>();
  for (const pg of pagamentos as Pagamento[]) {
    if (!pg.clienteId) continue;
    pagoPorCliente.set(pg.clienteId, (pagoPorCliente.get(pg.clienteId) ?? 0) + pg.valor);
  }
  const projetosPorCliente = new Map<string, number>();
  for (const p of projetos) {
    if (p.clienteId) projetosPorCliente.set(p.clienteId, (projetosPorCliente.get(p.clienteId) ?? 0) + 1);
  }
  const topClientes = [...pagoPorCliente.entries()]
    .map(([id, v]) => ({ id, nome: clienteNome.get(id) ?? "(sem nome)", v, p: projetosPorCliente.get(id) ?? 0 }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 5);

  // KPIs
  const fechados = projetos.filter((p: Projeto) => p.status === "terminado" || p.status === "fechado").length;
  const ticketMedio = fechados > 0 ? Math.round(receita6m / fechados) : 0;

  return (
    <>
      <Topbar
        crumbs={["Painel", "Relatórios"]}
        titleHtml={`Relatórios · <em>${now.getFullYear()}</em>`}
        description="Performance financeira e operacional · últimos 6 meses."
      />

      <div className="content">
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <KpiCard
            tone="ink"
            label="Receita 6 meses"
            value={receita6m.toLocaleString("pt-PT")}
            unit="€"
            icon={Coins}
            hint="vs. semestre anterior"
            delta={receitaDelta != null ? { text: `${receitaDelta >= 0 ? "+" : ""}${receitaDelta}%`, dir: receitaDelta >= 0 ? "up" : "down" } : undefined}
          />
          <KpiCard label="Projectos fechados" value={fechados} icon={FolderKanban} hint="terminados + fechados" />
          <KpiCard tone="accent" label="Ticket médio" value={ticketMedio.toLocaleString("pt-PT")} unit="€" icon={Receipt} hint="receita / fechados" />
          <KpiCard tone="amber" label="Clientes" value={clientes.length} icon={Users} hint="total na base" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }} className="rel-row">
          <div className="card">
            <div className="ch">
              <div>
                <div className="t">Receita mensal</div>
                <div className="sub">Em euros · pagamentos recebidos</div>
              </div>
              <span className="chart-legend it"><span className="sw" style={{ background: "var(--ember)" }} />Receita</span>
            </div>
            <div className="cb"><LineChart data={lineData} /></div>
          </div>

          <div className="card">
            <div className="ch"><div className="t">Distribuição actual</div></div>
            <div className="cb" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <Donut data={donut} />
              <div className="col" style={{ gap: 8, flex: 1, minWidth: 140 }}>
                {donut.map((d) => (
                  <div key={d.l} className="row" style={{ gap: 8, fontSize: 12.5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: d.c }} />
                    <span className="muted" style={{ flex: 1 }}>{d.l}</span>
                    <span className="ink mono" style={{ fontWeight: 500 }}>{d.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }} className="rel-row">
          <div className="card">
            <div className="ch">
              <div>
                <div className="t">Projectos por categoria</div>
                <div className="sub">Volume mensal — empilhado</div>
              </div>
              <div className="row" style={{ gap: 14, flexWrap: "wrap" }}>
                <span className="chart-legend it"><span className="sw" style={{ background: "var(--ember)" }} />Assistência</span>
                <span className="chart-legend it"><span className="sw" style={{ background: "var(--apricot)" }} />Web & Digital</span>
                <span className="chart-legend it"><span className="sw" style={{ background: "var(--peach)" }} />Recuperação</span>
              </div>
            </div>
            <div className="cb"><BarChart data={barData} /></div>
          </div>

          <div className="card">
            <div className="ch"><div className="t">Top clientes · 6 meses</div></div>
            <div className="cb" style={{ padding: 0 }}>
              {topClientes.length === 0 ? (
                <p className="muted" style={{ fontSize: 13, padding: "16px 20px" }}>Sem pagamentos registados.</p>
              ) : (
                topClientes.map((x, i) => (
                  <div
                    key={x.nome}
                    style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center", padding: "12px 20px", borderBottom: i < topClientes.length - 1 ? "1px dashed rgba(90, 14, 14, 0.10)" : "0" }}
                  >
                    <div className={`av-c sm ${avFor(x.nome)}`}>{initials(x.nome)}</div>
                    <div style={{ minWidth: 0 }}>
                      <Link href={`/painel/clientes/${x.id}`} style={{ color: "var(--ink)", fontWeight: 500, fontSize: 13 }} className="hover:text-ember">{x.nome}</Link>
                      <div className="muted" style={{ fontSize: 11.5 }}>{x.p} projecto{x.p === 1 ? "" : "s"}</div>
                    </div>
                    <div className="num" style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14 }}>
                      {Math.round(x.v).toLocaleString("pt-PT")}<span className="mono muted" style={{ fontSize: 11, marginLeft: 2 }}>€</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
