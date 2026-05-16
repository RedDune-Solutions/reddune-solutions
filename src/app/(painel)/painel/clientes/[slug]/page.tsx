import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Euro, ListChecks, AlertCircle, CheckCircle2, Mail, Phone, FileText, Tag } from "lucide-react";
import { getAllTarefas, getSyncMeta } from "@/lib/mongodb/tarefas";
import { getAllClientes } from "@/lib/mongodb/clientes";
import { Topbar } from "@/components/painel/Topbar";
import { TarefaCard } from "@/components/painel/TarefaCard";
import { KpiCard } from "@/components/painel/KpiCard";
import { Markdown } from "@/components/painel/Markdown";
import { Button } from "@/components/ui/button";
import { findClienteBySlug, clienteToSlug } from "@/lib/slug";
import { STATUS_GROUPS, type TarefaPublic } from "@/types/tarefa";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export default async function ClienteDetailPage({ params }: { params: Params }) {
  const [{ slug }, allTarefas, allClientes, meta] = await Promise.all([
    params,
    getAllTarefas(),
    getAllClientes(),
    getSyncMeta(),
  ]);

  const clientesUnique = Array.from(
    new Set([
      ...allTarefas
        .map((t) => t.cliente)
        .filter((c): c is string => Boolean(c && c.length > 0)),
      ...allClientes
        .map((c) => String(c.nome ?? "").trim())
        .filter((n) => n.length > 0),
    ])
  );
  const clienteName = findClienteBySlug(slug, clientesUnique);
  if (!clienteName) notFound();

  const ficha = allClientes.find((c) => {
    const nome = String(c.nome ?? "").trim();
    return clienteToSlug(nome) === clienteToSlug(clienteName);
  });

  const bodyMd = ficha && typeof ficha.bodyMd === "string" ? ficha.bodyMd : null;
  const email = ficha && typeof ficha.email === "string" ? ficha.email : null;
  const telefone = ficha && typeof ficha.telefone === "string" ? ficha.telefone : null;
  const nif = ficha && (typeof ficha.nif === "string" || typeof ficha.nif === "number") ? String(ficha.nif) : null;
  const relacao = ficha && typeof ficha["relação"] === "string" ? ficha["relação"] : null;
  const estado = ficha && typeof ficha.estado === "string" ? ficha.estado : null;
  const contactoPreferido = ficha && typeof ficha["contacto-preferido"] === "string" ? ficha["contacto-preferido"] : null;

  const tarefas = allTarefas.filter((t) => t.cliente === clienteName);

  const active = tarefas.filter(
    (t) =>
      STATUS_GROUPS.ativo.includes(t.status) ||
      STATUS_GROUPS.proximo.includes(t.status) ||
      STATUS_GROUPS.aguarda.includes(t.status)
  );
  const finished = tarefas.filter(
    (t) =>
      STATUS_GROUPS.pronto.includes(t.status) ||
      STATUS_GROUPS.arquivo.includes(t.status)
  );

  const totalValor = tarefas.reduce(
    (sum, t) => sum + (t.valorEstimado ?? 0),
    0
  );

  // Order by dataCriado desc (nulls last)
  const sorted = [...tarefas].sort((a, b) => {
    const aDate = a.dataCriado ?? "";
    const bDate = b.dataCriado ?? "";
    return bDate.localeCompare(aDate);
  });

  return (
    <>
      <Topbar
        title={clienteName}
        description={`${tarefas.length} tarefa${tarefas.length === 1 ? "" : "s"} no histórico.`}
        syncedAt={meta?.updatedAt}
        syncCount={meta?.count}
      />

      <div className="px-6 lg:px-8 py-8 space-y-10 max-w-6xl">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/painel/clientes">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar a clientes
          </Link>
        </Button>

        {(estado || relacao || contactoPreferido) && (
          <div className="flex flex-wrap gap-2">
            {estado && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-cream/50 px-3 py-1 text-xs">
                <Tag className="h-3 w-3" aria-hidden="true" /> {estado}
              </span>
            )}
            {relacao && (
              <span className="inline-flex items-center rounded-full border border-border bg-cream/50 px-3 py-1 text-xs">
                {relacao}
              </span>
            )}
            {contactoPreferido && (
              <span className="inline-flex items-center rounded-full border border-border bg-cream/50 px-3 py-1 text-xs">
                Contacto: {contactoPreferido}
              </span>
            )}
          </div>
        )}

        {(email || telefone || nif) && (
          <div className="rounded-xl border border-border bg-card p-5 grid gap-2 sm:grid-cols-3">
            {email && (
              <a href={`mailto:${email}`} className="inline-flex items-center gap-2 text-sm hover:text-primary">
                <Mail className="h-4 w-4 text-muted-foreground" /> {email}
              </a>
            )}
            {telefone && (
              <a href={`tel:${telefone}`} className="inline-flex items-center gap-2 text-sm hover:text-primary">
                <Phone className="h-4 w-4 text-muted-foreground" /> {telefone}
              </a>
            )}
            {nif && (
              <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                NIF: <strong className="text-foreground">{nif}</strong>
              </p>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Tarefas"
            value={tarefas.length}
            icon={ListChecks}
            tone="default"
          />
          <KpiCard
            label="Em curso/espera"
            value={active.length}
            icon={AlertCircle}
            tone="accent"
          />
          <KpiCard
            label="Concluídas"
            value={finished.length}
            icon={CheckCircle2}
            tone="green"
          />
          <KpiCard
            label="Valor estimado"
            value={`${totalValor.toFixed(0)}€`}
            icon={Euro}
            tone="default"
            hint="Soma de todas as tarefas"
          />
        </div>

        {active.length > 0 && (
          <section>
            <h2 className="font-headline text-xl md:text-2xl font-semibold tracking-tight mb-4">
              Activas
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {active.map((tarefa) => (
                <TarefaCard key={tarefa.id} tarefa={tarefa} />
              ))}
            </div>
          </section>
        )}

        {sorted.length > 0 && (
          <section>
            <h2 className="font-headline text-xl md:text-2xl font-semibold tracking-tight mb-4">
              Histórico completo
            </h2>
            <ClienteTimeline tarefas={sorted} />
          </section>
        )}

        {bodyMd && (
          <section className="rounded-xl border border-border bg-card p-6">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              Ficha completa
            </p>
            <Markdown>{bodyMd}</Markdown>
          </section>
        )}
      </div>
    </>
  );
}

function ClienteTimeline({ tarefas }: { tarefas: TarefaPublic[] }) {
  return (
    <ol className="relative border-l border-border ml-3 space-y-6 pl-6">
      {tarefas.map((t) => (
        <li key={t.id} className="relative">
          <span
            aria-hidden="true"
            className="absolute -left-[28px] top-1.5 inline-flex h-3 w-3 rounded-full border-2 border-background bg-primary"
          />
          <TarefaCard tarefa={t} />
        </li>
      ))}
    </ol>
  );
}
