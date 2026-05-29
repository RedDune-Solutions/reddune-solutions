import Link from "next/link";
import { Users, FolderKanban, AlertTriangle, RefreshCw, MoreVertical } from "lucide-react";
import { getAllClientes } from "@/lib/mongodb/clientes";
import { getAllProjetos } from "@/lib/mongodb/projetos";
import { getAllPagamentos } from "@/lib/mongodb/pagamentos";
import { Topbar } from "@/components/painel/Topbar";
import { KpiCard } from "@/components/painel/KpiCard";
import { NovoClienteButton } from "@/components/painel/NovoClienteButton";
import { STATUS_GROUPS } from "@/types/projeto";

export const dynamic = "force-dynamic";

const AV = ["a", "b", "c", "d"] as const;
function avFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AV[h % AV.length];
}
function initials(name: string): string {
  return name.split(/\s+/).map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

export default async function ClientesPage() {
  const [clientes, projetos, pagamentos] = await Promise.all([
    getAllClientes(),
    getAllProjetos(),
    getAllPagamentos(),
  ]);

  const pagoPorProjeto = new Map<string, number>();
  for (const p of pagamentos) {
    pagoPorProjeto.set(p.projetoId, (pagoPorProjeto.get(p.projetoId) ?? 0) + p.valor);
  }

  type Agg = { total: number; ativas: number; divida: number; ult: string | null };
  const agg = new Map<string, Agg>();
  for (const p of projetos) {
    if (!p.clienteId) continue;
    const a = agg.get(p.clienteId) ?? { total: 0, ativas: 0, divida: 0, ult: null };
    a.total += 1;
    if (
      STATUS_GROUPS.ativo.includes(p.status) ||
      STATUS_GROUPS.proximo.includes(p.status) ||
      STATUS_GROUPS.aguardaEncomenda.includes(p.status) ||
      STATUS_GROUPS.pronto.includes(p.status)
    ) {
      a.ativas += 1;
    }
    if (p.status === "terminado" && p.valorEstimado != null) {
      const restante = p.valorEstimado - (pagoPorProjeto.get(p.id) ?? 0);
      if (restante > 0) a.divida += restante;
    }
    if (p.dataCriado && (!a.ult || p.dataCriado > a.ult)) a.ult = p.dataCriado;
    agg.set(p.clienteId, a);
  }

  const sorted = [...clientes].sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt"));

  const comProjecto = sorted.filter((c) => (agg.get(c.id)?.ativas ?? 0) > 0).length;
  const comDividaList = sorted.filter((c) => (agg.get(c.id)?.divida ?? 0) > 0);
  const dividaTotal = comDividaList.reduce((s, c) => s + (agg.get(c.id)?.divida ?? 0), 0);
  const recorrentes = sorted.filter((c) => (agg.get(c.id)?.total ?? 0) >= 3).length;

  return (
    <>
      <Topbar
        crumbs={["Painel", "Clientes"]}
        titleHtml={`Clientes · <em>${clientes.length}</em>`}
        description={`${comProjecto} com projectos activos.`}
        actions={<NovoClienteButton />}
      />

      <div className="content">
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <KpiCard label="Total" value={clientes.length} icon={Users} hint="fichas registadas" />
          <KpiCard tone="accent" label="Com projecto activo" value={comProjecto} icon={FolderKanban} hint={clientes.length ? `${Math.round((comProjecto / clientes.length) * 100)}% da base` : "—"} />
          <KpiCard tone="amber" label="Com dívida" value={comDividaList.length} icon={AlertTriangle} hint={dividaTotal > 0 ? `${Math.round(dividaTotal).toLocaleString("pt-PT")}€ por receber` : "—"} />
          <KpiCard tone="green" label="Recorrentes" value={recorrentes} icon={RefreshCw} hint="≥ 3 projectos" />
        </div>

        {sorted.length === 0 ? (
          <div className="empty">
            <div className="ic"><Users aria-hidden="true" /></div>
            <div className="t">Sem clientes</div>
            <div className="desc">Clica em “Novo cliente” para adicionar o primeiro.</div>
          </div>
        ) : (
          <div className="card flat" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th style={{ width: 240 }}>Contacto</th>
                    <th style={{ width: 160 }}>Local</th>
                    <th style={{ width: 110 }}>Projectos</th>
                    <th style={{ width: 120 }}>Última</th>
                    <th className="right" style={{ width: 110 }}>Dívida</th>
                    <th style={{ width: 44 }} />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((c) => {
                    const a = agg.get(c.id);
                    return (
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
                        <td>
                          {c.telefone && <div className="mono" style={{ fontSize: 12 }}>{c.telefone}</div>}
                          {c.email && <div className="mono muted" style={{ fontSize: 11 }}>{c.email}</div>}
                          {!c.telefone && !c.email && <span className="muted mono">—</span>}
                        </td>
                        <td><span className="muted" style={{ fontSize: 12 }}>{c.morada ?? "—"}</span></td>
                        <td>
                          <span className="badge" style={{ background: (a?.total ?? 0) > 0 ? "rgba(214, 66, 42, 0.10)" : "var(--cream-deep)", color: (a?.total ?? 0) > 0 ? "var(--dune)" : "var(--ink-mute)" }}>
                            <span className="dot" /> {a?.total ?? 0}
                            {(a?.ativas ?? 0) > 0 && <span style={{ marginLeft: 4, opacity: 0.7 }}>· {a!.ativas} act.</span>}
                          </span>
                        </td>
                        <td><span className="muted" style={{ fontSize: 12 }}>{fmtDate(a?.ult ?? c.criadoEm)}</span></td>
                        <td className="right">
                          {(a?.divida ?? 0) > 0 ? <span className="num warn">{Math.round(a!.divida).toLocaleString("pt-PT")}€</span> : <span className="muted mono">—</span>}
                        </td>
                        <td>
                          <Link href={`/painel/clientes/${c.id}`} aria-label="Abrir ficha">
                            <MoreVertical className="row-menu" aria-hidden="true" />
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
      </div>
    </>
  );
}
