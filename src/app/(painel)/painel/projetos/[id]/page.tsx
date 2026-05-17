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
import { LinhasBreakdown } from "@/components/painel/LinhasBreakdown";
import { TarefaRowMenu } from "@/components/painel/TarefaRowMenu";
import { TarefaChecklist } from "@/components/painel/TarefaChecklist";
import { TarefaForm } from "@/components/painel/TarefaForm";
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
  const [projeto, tarefas, clientes, pagamentos] = await Promise.all([
    getProjetoById(id),
    getTarefasByProjeto(id),
    getAllClientes(),
    getPagamentosByProjeto(id),
  ]);

  if (!projeto) notFound();

  const totalTarefas = tarefas.length;
  const tarefasFeitas = tarefas.filter((t) => t.feita).length;

  return (
    <>
      <Topbar title={projeto.titulo} description={projeto.clienteNome ?? undefined} />

      <div className="px-6 lg:px-8 py-8">
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
            {/* Editor inline */}
            <section className="rounded-xl border border-border bg-card">
              <TarefaForm projeto={projeto} clientes={clientes} />
            </section>

            {/* Checklist de tarefas */}
            <section className="rounded-xl border border-border bg-card p-6">
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
            />

            {/* Breakdown linhas (read-only resumo) */}
            {projeto.linhas && projeto.linhas.length > 0 && (
              <section className="rounded-xl border border-border bg-card p-6">
                <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-4">
                  <Euro className="h-3.5 w-3.5" aria-hidden="true" />
                  Custos
                </p>
                <LinhasBreakdown linhas={projeto.linhas} />
              </section>
            )}
          </div>

          {/* ── Aside ── */}
          <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4 lg:sticky lg:top-6">
            {/* Informações */}
            <div className="rounded-xl border border-border bg-surface-elevated p-5 space-y-3">
              <h2 className="font-headline text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-1">
                Informações
              </h2>
              {projeto.clienteNome && (
                <InfoRow icon={User} label="Cliente" value={projeto.clienteNome} />
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
