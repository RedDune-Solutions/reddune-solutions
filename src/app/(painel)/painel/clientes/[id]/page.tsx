import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Euro,
  ListChecks,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { getAllProjetos } from "@/lib/mongodb/projetos";
import { getClienteById } from "@/lib/mongodb/clientes";
import { getPagamentosByCliente } from "@/lib/mongodb/pagamentos";
import { METODO_LABEL } from "@/types/pagamento";
import { Topbar } from "@/components/painel/Topbar";
import { TarefaCard } from "@/components/painel/TarefaCard";
import { KpiCard } from "@/components/painel/KpiCard";
import { ClienteForm } from "@/components/painel/ClienteForm";
import { Button } from "@/components/ui/button";
import { STATUS_GROUPS, type Projeto } from "@/types/projeto";
import { parseIsoDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function ClienteDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const [cliente, allProjetos, pagamentos] = await Promise.all([
    getClienteById(id),
    getAllProjetos(),
    getPagamentosByCliente(id),
  ]);

  if (!cliente) notFound();

  const projetos = allProjetos.filter((p) => p.clienteId === id);

  const active = projetos.filter(
    (p) =>
      STATUS_GROUPS.ativo.includes(p.status) ||
      STATUS_GROUPS.proximo.includes(p.status) ||
      STATUS_GROUPS.aguarda.includes(p.status)
  );
  const finished = projetos.filter(
    (p) =>
      STATUS_GROUPS.pronto.includes(p.status) ||
      STATUS_GROUPS.arquivo.includes(p.status)
  );

  const totalValor = projetos.reduce((sum, p) => sum + (p.valorEstimado ?? 0), 0);

  return (
    <>
      <Topbar
        title={cliente.nome}
        description={`${projetos.length} projecto${projetos.length === 1 ? "" : "s"} no histórico.`}
      />

      <div className="px-6 lg:px-8 py-8 space-y-8 max-w-6xl">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link href="/painel/clientes">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Voltar a clientes
            </Link>
          </Button>
        </div>

        {/* Ficha editável inline */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-5">
            Ficha do cliente
          </h2>
          <ClienteForm cliente={cliente} />
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Projectos" value={projetos.length} icon={ListChecks} tone="default" />
          <KpiCard label="Em curso/espera" value={active.length} icon={AlertCircle} tone="accent" />
          <KpiCard label="Concluídos" value={finished.length} icon={CheckCircle2} tone="green" />
          <KpiCard
            label="Valor estimado"
            value={`${totalValor.toFixed(0)}€`}
            icon={Euro}
            tone="default"
            hint="Soma de todos os projectos"
          />
        </div>

        {/* Activos */}
        {active.length > 0 && (
          <section>
            <h2 className="font-headline text-lg font-semibold tracking-tight mb-4">
              Activos
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {active.map((projeto) => (
                <TarefaCard key={projeto.id} projeto={projeto} />
              ))}
            </div>
          </section>
        )}

        {/* Pagamentos histórico */}
        {pagamentos.length > 0 && (
          <section>
            <h2 className="font-headline text-lg font-semibold tracking-tight mb-4">
              Histórico de pagamentos
            </h2>
            <PagamentosHistorico
              pagamentos={pagamentos}
              projetosMap={Object.fromEntries(projetos.map((p) => [p.id, p.titulo]))}
            />
          </section>
        )}

        {/* Histórico */}
        {projetos.length > 0 && (
          <section>
            <h2 className="font-headline text-lg font-semibold tracking-tight mb-4">
              Histórico completo
            </h2>
            <ProjetoTimeline projetos={projetos} />
          </section>
        )}

        {projetos.length === 0 && (
          <p className="text-sm text-muted-foreground">Sem projectos associados a este cliente.</p>
        )}
      </div>
    </>
  );
}

function PagamentosHistorico({
  pagamentos,
  projetosMap,
}: {
  pagamentos: import("@/types/pagamento").Pagamento[];
  projetosMap: Record<string, string>;
}) {
  const total = pagamentos.reduce((s, p) => s + p.valor, 0);
  const grupos = new Map<string, typeof pagamentos>();
  for (const p of pagamentos) {
    const arr = grupos.get(p.projetoId) ?? [];
    arr.push(p);
    grupos.set(p.projetoId, arr);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <p className="font-mono tabular-nums text-sm">
        Total pago: <strong>{total}€</strong> <span className="text-muted-foreground">· {pagamentos.length} pagamento{pagamentos.length === 1 ? "" : "s"}</span>
      </p>
      {Array.from(grupos.entries()).map(([projetoId, lista]) => {
        const sub = lista.reduce((s, p) => s + p.valor, 0);
        return (
          <div key={projetoId} className="border-t border-border pt-3">
            <div className="flex items-center justify-between mb-2">
              <Link
                href={`/painel/projetos/${projetoId}`}
                className="text-sm font-semibold hover:text-primary truncate"
              >
                {projetosMap[projetoId] ?? "(projeto removido)"}
              </Link>
              <span className="font-mono tabular-nums text-sm">{sub}€</span>
            </div>
            <ul className="space-y-1 text-xs">
              {lista.map((p) => (
                <li key={p.id} className="flex items-center gap-3 text-muted-foreground">
                  <span className="tabular-nums w-24">
                    {new Date(p.data).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                  <span className="font-mono tabular-nums w-16 text-foreground">{p.valor}€</span>
                  {p.metodo && <span className="rounded bg-muted px-1.5 py-0.5">{METODO_LABEL[p.metodo]}</span>}
                  {p.notas && <span className="truncate flex-1">{p.notas}</span>}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function ProjetoTimeline({ projetos }: { projetos: Projeto[] }) {
  const sorted = [...projetos].sort((a, b) => {
    const aDate = parseIsoDate(a.dataCriado ?? null);
    const bDate = parseIsoDate(b.dataCriado ?? null);
    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;
    return bDate.getTime() - aDate.getTime();
  });

  return (
    <ol className="relative border-l border-border ml-3 space-y-6 pl-6">
      {sorted.map((p) => (
        <li key={p.id} className="relative">
          <span
            aria-hidden="true"
            className="absolute -left-[28px] top-1.5 inline-flex h-3 w-3 rounded-full border-2 border-background bg-primary"
          />
          <TarefaCard projeto={p} />
        </li>
      ))}
    </ol>
  );
}
