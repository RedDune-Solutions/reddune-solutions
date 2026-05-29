import Link from "next/link";
import { Coins, AlertTriangle, Clock, Check, Mail, ChevronDown } from "lucide-react";
import { getAllProjetos } from "@/lib/mongodb/projetos";
import { getAllPagamentos } from "@/lib/mongodb/pagamentos";
import { getAllClientes } from "@/lib/mongodb/clientes";
import { Topbar } from "@/components/painel/Topbar";
import { KpiCard } from "@/components/painel/KpiCard";
import type { Projeto } from "@/types/projeto";

export const dynamic = "force-dynamic";

type Bucket = "30+" | "10-30" | "0-10";
type Filter = "todas" | "30+" | "semana";

const AV = ["a", "b", "c", "d"] as const;

function avFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AV[h % AV.length];
}

function initials(name: string): string {
  return name.split(/\s+/).map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function diasDesde(iso: string | null): number {
  if (!iso) return 0;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return 0;
  return Math.max(0, Math.floor((Date.now() - d) / 86400000));
}

function bucketOf(dias: number): Bucket {
  if (dias >= 30) return "30+";
  if (dias >= 10) return "10-30";
  return "0-10";
}

export default async function DividasPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  const [allProjetos, pagamentos, clientes, params] = await Promise.all([
    getAllProjetos(),
    getAllPagamentos(),
    getAllClientes(),
    searchParams,
  ]);

  const filter: Filter =
    params.f === "30+" || params.f === "semana" ? (params.f as Filter) : "todas";

  const clienteById = new Map(clientes.map((c) => [c.id, c]));
  const pagoPorProjeto = new Map<string, number>();
  const ultimoPagamento = new Map<string, string>();
  for (const p of pagamentos) {
    pagoPorProjeto.set(p.projetoId, (pagoPorProjeto.get(p.projetoId) ?? 0) + p.valor);
    const prev = ultimoPagamento.get(p.projetoId);
    if (!prev || (p.data && p.data > prev)) ultimoPagamento.set(p.projetoId, p.data);
  }

  type Row = {
    projeto: Projeto;
    restante: number;
    dias: number;
    bucket: Bucket;
    ultCobranca: string | null;
  };

  const rows: Row[] = allProjetos
    .filter((p) => p.status === "terminado" && p.valorEstimado != null && (pagoPorProjeto.get(p.id) ?? 0) < (p.valorEstimado ?? 0))
    .map((p) => {
      const restante = (p.valorEstimado ?? 0) - (pagoPorProjeto.get(p.id) ?? 0);
      const dias = diasDesde(p.dataFechado ?? p.dataCriado);
      return {
        projeto: p,
        restante,
        dias,
        bucket: bucketOf(dias),
        ultCobranca: ultimoPagamento.get(p.id) ?? null,
      };
    })
    .sort((a, b) => b.dias - a.dias);

  const total = rows.reduce((s, r) => s + r.restante, 0);
  const t30 = rows.filter((r) => r.bucket === "30+").reduce((s, r) => s + r.restante, 0);
  const t1030 = rows.filter((r) => r.bucket === "10-30").reduce((s, r) => s + r.restante, 0);
  const t010 = rows.filter((r) => r.bucket === "0-10").reduce((s, r) => s + r.restante, 0);
  const n30 = rows.filter((r) => r.bucket === "30+").length;
  const n1030 = rows.filter((r) => r.bucket === "10-30").length;
  const n010 = rows.filter((r) => r.bucket === "0-10").length;

  const visible = rows.filter((r) => {
    if (filter === "30+") return r.bucket === "30+";
    if (filter === "semana") return r.dias <= 7;
    return true;
  });

  const eur = (n: number) => n.toLocaleString("pt-PT");

  return (
    <>
      <Topbar
        crumbs={["Painel", "Dívidas"]}
        titleHtml={`Em dívida · <em>${eur(Math.round(total))}€</em>`}
        description={`Projectos terminados com saldo por receber · ${rows.length} ${rows.length === 1 ? "entrada" : "entradas"}.`}
      />

      <div className="content">
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <KpiCard tone="ink" label="Total em dívida" value={eur(Math.round(total))} unit="€" icon={Coins} hint={`${rows.length} projecto${rows.length === 1 ? "" : "s"}`} />
          <KpiCard tone="accent" label="30+ dias" value={eur(Math.round(t30))} unit="€" icon={AlertTriangle} hint={`${n30} projecto${n30 === 1 ? "" : "s"} · alta prioridade`} />
          <KpiCard tone="amber" label="10–30 dias" value={eur(Math.round(t1030))} unit="€" icon={Clock} hint={`${n1030} · seguimento`} />
          <KpiCard tone="green" label="Recente (≤10d)" value={eur(Math.round(t010))} unit="€" icon={Check} hint={`${n010} · aguardar`} />
        </div>

        <div className="row between">
          <div className="tabs">
            <FilterTab f="todas" cur={filter} label="Todas" n={rows.length} />
            <FilterTab f="30+" cur={filter} label="30+ dias" n={n30} />
            <FilterTab f="semana" cur={filter} label="Esta semana" />
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="empty">
            <div className="ic"><Check aria-hidden="true" /></div>
            <div className="t">Sem dívidas</div>
            <div className="desc">Projectos terminados e por cobrar aparecem aqui.</div>
          </div>
        ) : (
          <div className="col" style={{ gap: 10 }}>
            {visible.map(({ projeto: p, restante, dias, bucket, ultCobranca }) => {
              const tone = bucket === "30+" ? "alert" : bucket === "10-30" ? "warn" : "ok";
              const bg =
                tone === "alert"
                  ? "linear-gradient(90deg, rgba(214, 66, 42, 0.08), transparent 60%)"
                  : tone === "warn"
                    ? "linear-gradient(90deg, rgba(212, 144, 39, 0.10), transparent 60%)"
                    : "linear-gradient(90deg, rgba(74, 124, 89, 0.08), transparent 60%)";
              const accent = tone === "alert" ? "var(--ember)" : tone === "warn" ? "#8a5a13" : "#3f6a4d";
              const cliente = p.clienteId ? clienteById.get(p.clienteId) : null;
              const nome = p.clienteNome ?? cliente?.nome ?? "Sem cliente";
              const email = cliente?.email ?? null;
              return (
                <div
                  key={p.id}
                  className="card flat"
                  style={{
                    background: `${bg}, var(--sand-warm)`,
                    borderLeft: `3px solid ${accent}`,
                    padding: "14px 18px",
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto auto",
                    gap: 18,
                    alignItems: "center",
                  }}
                >
                  <div className={`av-c ${avFor(nome)}`}>{initials(nome)}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <span className="mono muted" style={{ fontSize: 10.5, letterSpacing: "0.1em" }}>#{p.id.slice(0, 8)}</span>
                      <Link href={`/painel/projetos/${p.id}`} style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14.5, color: "var(--ink)" }}>{p.titulo}</Link>
                    </div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                      {p.clienteId ? (
                        <Link href={`/painel/clientes/${p.clienteId}`} className="hover:text-ember">{nome}</Link>
                      ) : (
                        nome
                      )}
                      {ultCobranca ? ` · última cobrança ${fmtDate(ultCobranca)}` : " · sem pagamentos"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: accent, letterSpacing: "-0.02em" }}>
                      {eur(Math.round(restante))}<span className="mono muted" style={{ fontSize: 13, marginLeft: 2 }}>€</span>
                    </div>
                    <div className="mono muted" style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      {dias} dias em dívida
                    </div>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    {email && (
                      <a className="btn ghost tiny" href={`mailto:${email}?subject=${encodeURIComponent("Pagamento pendente · " + p.titulo)}`}>
                        <Mail className="ic" aria-hidden="true" /> Lembrete
                      </a>
                    )}
                    <Link className="btn ghost tiny" href={`/painel/projetos/${p.id}`}>
                      <Check className="ic" aria-hidden="true" /> Receber
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function FilterTab({ f, cur, label, n }: { f: Filter; cur: Filter; label: string; n?: number }) {
  const href = f === "todas" ? "/painel/dividas" : `/painel/dividas?f=${encodeURIComponent(f)}`;
  return (
    <Link href={href} className={cur === f ? "active" : undefined} style={{ display: "inline-flex", alignItems: "center" }}>
      {label}
      {n != null && <span className="num">{n}</span>}
    </Link>
  );
}
