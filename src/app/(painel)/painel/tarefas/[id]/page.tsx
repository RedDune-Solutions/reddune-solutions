import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Folder, Euro, FileText, Clock, type LucideIcon } from "lucide-react";
import { getTarefaById } from "@/lib/mongodb/tarefas";
import { getPendingEditsByTarefa } from "@/lib/mongodb/edits";
import { Topbar } from "@/components/painel/Topbar";
import { StatusBadge } from "@/components/painel/StatusBadge";
import { EditTarefaActions } from "@/components/painel/EditTarefaActions";
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

export default async function TarefaDetalhePage({ params }: { params: Params }) {
  const { id } = await params;
  const [tarefa, pendingEdits] = await Promise.all([
    getTarefaById(id),
    getPendingEditsByTarefa(id),
  ]);
  if (!tarefa) notFound();

  return (
    <>
      <Topbar title={tarefa.titulo} description={tarefa.cliente ?? undefined} />

      <div className="px-6 lg:px-8 py-8 space-y-8 max-w-4xl">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/painel/tarefas">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar a tarefas
          </Link>
        </Button>

        {pendingEdits.length > 0 && (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
            <p className="inline-flex items-center gap-2 font-medium text-amber-700 dark:text-amber-300">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {pendingEdits.length} edição pendente sync para vault
            </p>
            <ul className="mt-2 space-y-1 text-xs text-amber-700/85 dark:text-amber-300/85">
              {pendingEdits.map((e) => (
                <li key={String(e._id)}>
                  <strong>{e.field}</strong> → {e.newValue}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-lg border border-border bg-surface-elevated p-6">
          <h2 className="font-headline text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-4">
            Acções rápidas
          </h2>
          <EditTarefaActions tarefa={tarefa} />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={tarefa.status} />
          {tarefa.tipo && (
            <span className="inline-flex items-center rounded-full border border-border bg-cream/50 px-3 py-1 text-xs font-medium uppercase tracking-wide">
              {tarefa.tipo.replace("-", " ")}
            </span>
          )}
          {tarefa.responsavel && (
            <span className="inline-flex items-center rounded-full border border-border bg-cream/50 px-3 py-1 text-xs">
              Responsável: <strong className="ml-1">{tarefa.responsavel}</strong>
            </span>
          )}
        </div>

        {tarefa.proximaAccao && (
          <section className="rounded-xl border border-accent/30 bg-accent/5 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              Próxima acção
            </p>
            <p className="mt-2 text-base md:text-lg leading-relaxed text-foreground">
              {tarefa.proximaAccao}
            </p>
          </section>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <DetailRow icon={User} label="Cliente" value={tarefa.cliente ?? "—"} />
          <DetailRow icon={Folder} label="Pasta" value={tarefa.pasta === "clientes" ? "Projetos de cliente" : "Projetos internos"} />
          <DetailRow icon={Calendar} label="Prazo" value={formatDate(tarefa.prazo)} />
          <DetailRow icon={Calendar} label="Criado" value={formatDate(tarefa.dataCriado)} />
          {tarefa.valorEstimado != null && (
            <DetailRow
              icon={Euro}
              label="Valor estimado"
              value={`${tarefa.valorEstimado.toFixed(2)} €`}
            />
          )}
        </div>

        {tarefa.notasResumo && (
          <section className="rounded-xl border border-border bg-card p-6">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              Resumo
            </p>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">
              {tarefa.notasResumo}
            </p>
          </section>
        )}

        <p className="text-xs text-muted-foreground">
          Fonte: <code className="rounded bg-muted px-1.5 py-0.5">Obsidian</code> ·
          Edição faz-se no vault do PC. Sync para vires aqui.
        </p>
      </div>
    </>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}
