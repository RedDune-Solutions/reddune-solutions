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

      <div className="px-6 lg:px-8 py-8 space-y-10 max-w-6xl">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link href="/painel/clientes">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Voltar a clientes
            </Link>
          </Button>
          <NovoClienteButton cliente={cliente} />
        </div>

        {(cliente.email || cliente.telefone || cliente.nif || cliente.morada) && (
          <div className="rounded-xl border border-border bg-card p-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cliente.email && (
              <a
                href={`mailto:${cliente.email}`}
                className="inline-flex items-center gap-2 text-sm hover:text-primary"
              >
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{cliente.email}</span>
              </a>
            )}
            {cliente.telefone && (
              <a
                href={`tel:${cliente.telefone}`}
                className="inline-flex items-center gap-2 text-sm hover:text-primary"
              >
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                {cliente.telefone}
              </a>
            )}
            {cliente.nif && (
              <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                NIF: <strong className="text-foreground">{cliente.nif}</strong>
              </p>
            )}
            {cliente.morada && (
              <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{cliente.morada}</span>
              </p>
            )}
          </div>
        )}

        {cliente.notas && (
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">
              Notas
            </p>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{cliente.notas}</p>
          </div>
        )}

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

        {active.length > 0 && (
          <section>
            <h2 className="font-headline text-xl md:text-2xl font-semibold tracking-tight mb-4">
              Activos
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {active.map((projeto) => (
                <TarefaCard key={projeto.id} projeto={projeto} />
              ))}
            </div>
          </section>
        )}

        {projetos.length > 0 && (
          <section>
            <h2 className="font-headline text-xl md:text-2xl font-semibold tracking-tight mb-4">
              Histórico completo
            </h2>
            <ProjetoTimeline projetos={projetos} />
          </section>
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
