import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Euro,
  ListChecks,
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  FileText,
  CreditCard,
} from "lucide-react";
import { getAllProjetos } from "@/lib/mongodb/projetos";
import { getClienteById } from "@/lib/mongodb/clientes";
import { Topbar } from "@/components/painel/Topbar";
import { TarefaCard } from "@/components/painel/TarefaCard";
import { KpiCard } from "@/components/painel/KpiCard";
import { NovoClienteButton } from "@/components/painel/NovoClienteButton";
import { Button } from "@/components/ui/button";
import { STATUS_GROUPS, type Projeto } from "@/types/projeto";
import { parseIsoDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

function Campo({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null | undefined;
  href?: string;
}) {
  const empty = !value;
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
        {label}
      </p>
      {empty ? (
        <p className="text-sm text-muted-foreground/50 italic">Sem informação</p>
      ) : href ? (
        <a href={href} className="text-sm text-foreground hover:text-primary transition-colors truncate block">
          {value}
        </a>
      ) : (
        <p className="text-sm text-foreground">{value}</p>
      )}
    </div>
  );
}

export default async function ClienteDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const [cliente, allProjetos] = await Promise.all([
    getClienteById(id),
    getAllProjetos(),
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
          <NovoClienteButton cliente={cliente} />
        </div>

        {/* Ficha completa — sempre visível */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-5">
            Ficha do cliente
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Campo
              label="Email"
              value={cliente.email}
              href={cliente.email ? `mailto:${cliente.email}` : undefined}
            />
            <Campo
              label="Telefone"
              value={cliente.telefone}
              href={cliente.telefone ? `tel:${cliente.telefone}` : undefined}
            />
            <Campo label="NIF" value={cliente.nif} />
            <Campo label="Morada" value={cliente.morada} />
            <div className="sm:col-span-2 space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                Notas
              </p>
              {cliente.notas ? (
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {cliente.notas}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">Sem informação</p>
              )}
            </div>
          </div>
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
