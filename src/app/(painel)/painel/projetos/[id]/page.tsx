import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  User,
  Euro,
  MapPin,
  CreditCard,
  CheckCircle2,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { getProjetoById } from "@/lib/mongodb/projetos";
import { getTarefasByProjeto } from "@/lib/mongodb/tarefas";
import { getAllClientes } from "@/lib/mongodb/clientes";
import { getPagamentosByProjeto } from "@/lib/mongodb/pagamentos";
import { PagamentosSection } from "@/components/painel/PagamentosSection";
import { Topbar } from "@/components/painel/Topbar";
import { CustosCard } from "@/components/painel/CustosCard";
import { TarefaRowMenu } from "@/components/painel/TarefaRowMenu";
import { TarefaChecklist } from "@/components/painel/TarefaChecklist";
import { TarefaForm } from "@/components/painel/TarefaForm";
import { ArquivosCard } from "@/components/painel/ArquivosCard";
import { PortalSection } from "@/components/painel/PortalSection";
import { getComentariosByProjeto } from "@/lib/mongodb/portal";
import { HardwareSection } from "@/components/painel/HardwareSection";
import { sanitizeArquivo } from "@/types/projeto";
import { StatusBadge } from "@/components/painel/StatusBadge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default async function ProjetoDetalhePage({ params }: { params: Params }) {
  const { id } = await params;
  const [projeto, tarefas, clientes, pagamentos, comentarios] = await Promise.all([
    getProjetoById(id),
    getTarefasByProjeto(id),
    getAllClientes(),
    getPagamentosByProjeto(id),
    getComentariosByProjeto(id),
  ]);

  if (!projeto) notFound();

  const totalTarefas = tarefas.length;
  const tarefasFeitas = tarefas.filter((t) => t.feita).length;

  return (
    <>
      <Topbar
        crumbs={["Painel", "Projectos", projeto.titulo]}
        title={projeto.titulo}
        description={projeto.clienteNome ?? undefined}
      />

      <div className="content">
        {/* Back + actions row */}
        <div className="flex items-center justify-between mb-8">
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link href="/painel/projetos">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Voltar a projectos
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <TarefaRowMenu projeto={projeto} />
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Status strip — orçado / recebido / em dívida */}
            <StatusStrip projeto={projeto} totalPago={pagamentos.reduce((s, p) => s + p.valor, 0)} />

            {/* Editor inline */}
            <section className="card">
              <TarefaForm projeto={projeto} clientes={clientes} />
            </section>

            {/* Ficheiros / Orçamentos */}
            <ArquivosCard
              projetoId={projeto.id}
              arquivos={(projeto.arquivos ?? []).map(sanitizeArquivo)}
            />

            {/* Portal do cliente */}
            <PortalSection
              projetoId={projeto.id}
              portalAtivo={!!projeto.portal && !projeto.portal.revogadoEm}
              links={projeto.links ?? []}
              comentarios={comentarios}
            />

            {/* Checklist de tarefas */}
            <section className="card" style={{ padding: 24 }}>
              <div className="flex items-center justify-between mb-4">
                <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
                  Tarefas
                  {totalTarefas > 0 && (
                    <span className="font-mono tabular-nums text-muted-foreground/70">
                      {tarefasFeitas}/{totalTarefas}
                    </span>
                  )}
                </p>
              </div>
              <TarefaChecklist tarefas={tarefas} projetoId={projeto.id} />
            </section>

            {/* Pagamentos */}
            <PagamentosSection
              projetoId={projeto.id}
              pagamentos={pagamentos}
              valorEstimado={projeto.valorEstimado}
              projetoStatus={projeto.status}
              projetoTitulo={projeto.titulo}
            />

            {/* Hardware (só assistência técnica) */}
            {projeto.categoria === "assistencia-tecnica" && (
              <HardwareSection projeto={projeto} />
            )}

            {/* Custos editável */}
            <CustosCard projeto={projeto} />
          </div>

          {/* ── Aside ── */}
          <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4 lg:sticky lg:top-6">
            {/* Badges derivadas */}
            <ProjetoBadges projeto={projeto} totalPago={pagamentos.reduce((s, p) => s + p.valor, 0)} />

            {/* Informações */}
            <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <h2 className="font-headline text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-1">
                Informações
              </h2>
              {projeto.clienteNome && (
                projeto.clienteId ? (
                  <div className="flex items-start gap-2.5">
                    <User className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Cliente</p>
                      <Link href={`/painel/clientes/${projeto.clienteId}`} className="text-sm font-medium truncate text-ink hover:text-ember block">
                        {projeto.clienteNome}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <InfoRow icon={User} label="Cliente" value={projeto.clienteNome} />
                )
              )}
              <InfoRow icon={Calendar} label="Prazo" value={formatDate(projeto.prazo)} />
              <InfoRow icon={Calendar} label="Criado" value={formatDate(projeto.dataCriado)} />
              {projeto.dataFechado && (
                <InfoRow icon={CheckCircle2} label="Fechado" value={formatDate(projeto.dataFechado)} />
              )}
              {projeto.valorEstimado != null && (
                <InfoRow
                  icon={Euro}
                  label="Valor estimado"
                  value={`${projeto.valorEstimado.toFixed(2)} €`}
                />
              )}
              {projeto.valorPago != null && (
                <InfoRow
                  icon={Euro}
                  label="Valor pago"
                  value={`${projeto.valorPago.toFixed(2)} €`}
                />
              )}
              {projeto.metodoPagamento && (
                <InfoRow icon={CreditCard} label="Pagamento" value={projeto.metodoPagamento} />
              )}
              {projeto.local && (
                <InfoRow icon={MapPin} label="Local" value={projeto.local.replace("-", " ")} />
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function ProjetoBadges({ projeto, totalPago }: { projeto: import("@/types/projeto").Projeto; totalPago: number }) {
  const today = new Date().toISOString().slice(0, 10);
  const emDivida = projeto.status === "terminado" && projeto.valorEstimado != null && totalPago < projeto.valorEstimado;
  const divida = emDivida ? (projeto.valorEstimado! - totalPago) : 0;
  const garantia = projeto.garantiaAte;
  const garantiaActiva = garantia && garantia >= today;
  const garantiaExpirada = garantia && garantia < today;

  if (!emDivida && !garantia) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {emDivida && (
        <span className="inline-flex items-center rounded-full bg-rose-500/10 text-rose-700 border border-rose-500/30 px-3 py-1 text-xs font-semibold">
          Em dívida: {divida}€
        </span>
      )}
      {garantiaActiva && (
        <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 px-3 py-1 text-xs font-medium">
          Garantia até {formatDate(garantia!)}
        </span>
      )}
      {garantiaExpirada && (
        <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground border border-border px-3 py-1 text-xs font-medium">
          Garantia expirada
        </span>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
          {label}
        </p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function StatusStrip({ projeto, totalPago }: { projeto: import("@/types/projeto").Projeto; totalPago: number }) {
  const orcado = projeto.valorEstimado;
  const divida = orcado != null ? Math.max(0, orcado - totalPago) : 0;
  const dias = projeto.dataCriado
    ? Math.max(0, Math.floor((Date.now() - new Date(projeto.dataCriado).getTime()) / 86400000))
    : null;
  const money = (n: number) => n.toLocaleString("pt-PT");

  return (
    <div className="card flat">
      <div
        className="cb"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", padding: "16px 20px" }}
      >
        <div className="row" style={{ gap: 12 }}>
          <StatusBadge status={projeto.status} />
          {dias != null && <span className="muted" style={{ fontSize: 12.5 }}>há {dias} dia{dias === 1 ? "" : "s"} no sistema</span>}
        </div>
        <div className="row" style={{ gap: 14 }}>
          <div>
            <div className="muted mono" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase" }}>Orçado</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
              {orcado != null ? money(orcado) : "—"}<span className="mono muted" style={{ fontSize: 13 }}>{orcado != null ? "€" : ""}</span>
            </div>
          </div>
          <div style={{ width: 1, alignSelf: "stretch", background: "rgba(90, 14, 14, 0.12)" }} />
          <div>
            <div className="muted mono" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase" }}>Recebido</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>{money(totalPago)}<span className="mono muted" style={{ fontSize: 13 }}>€</span></div>
          </div>
          <div style={{ width: 1, alignSelf: "stretch", background: "rgba(90, 14, 14, 0.12)" }} />
          <div>
            <div className="muted mono" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase" }}>Em dívida</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: divida > 0 ? "var(--ember)" : "var(--ink)" }}>{money(divida)}<span className="mono muted" style={{ fontSize: 13 }}>€</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
