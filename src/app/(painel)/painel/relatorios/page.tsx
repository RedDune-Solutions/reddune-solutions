import { Euro, Clock, ListChecks, Users } from "lucide-react";
import { getAllTarefas, getSyncMeta } from "@/lib/mongodb/tarefas";
import { Topbar } from "@/components/painel/Topbar";
import { KpiCard } from "@/components/painel/KpiCard";
import { StatusPie } from "@/components/painel/charts/StatusPie";
import { TipoBar } from "@/components/painel/charts/TipoBar";
import { ValorMensal } from "@/components/painel/charts/ValorMensal";
import { STATUS_GROUPS, TAREFA_STATUS, type TarefaStatus, type TarefaPublic } from "@/types/tarefa";

export const dynamic = "force-dynamic";

function monthKey(iso: string): string {
  return iso.slice(0, 7); // YYYY-MM
}

function buildValorMensal(tarefas: TarefaPublic[]): Array<{ mes: string; valor: number }> {
  const map = new Map<string, number>();
  for (const t of tarefas) {
    if (!t.dataCriado || !t.valorEstimado) continue;
    const key = monthKey(t.dataCriado);
    map.set(key, (map.get(key) ?? 0) + t.valorEstimado);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([mes, valor]) => ({ mes, valor }));
}

function topClientesPorValor(tarefas: TarefaPublic[]): Array<{ cliente: string; valor: number }> {
  const map = new Map<string, number>();
  for (const t of tarefas) {
    if (!t.cliente || !t.valorEstimado) continue;
    map.set(t.cliente, (map.get(t.cliente) ?? 0) + t.valorEstimado);
  }
  return [...map.entries()]
    .map(([cliente, valor]) => ({ cliente, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);
}

export default async function RelatoriosPage() {
  const [tarefas, meta] = await Promise.all([getAllTarefas(), getSyncMeta()]);

  const activas = tarefas.filter(
    (t) =>
      STATUS_GROUPS.ativo.includes(t.status) ||
      STATUS_GROUPS.proximo.includes(t.status) ||
      STATUS_GROUPS.aguarda.includes(t.status) ||
      STATUS_GROUPS.pronto.includes(t.status)
  );

  const valorTotalActivo = activas.reduce(
    (s, t) => s + (t.valorEstimado ?? 0),
    0
  );

  const clientesUnique = new Set(
    tarefas.map((t) => t.cliente).filter((c): c is string => Boolean(c))
  );

  const statusData = TAREFA_STATUS.map((status) => ({
    status,
    count: tarefas.filter((t) => t.status === status).length,
  }));

  const tipoMap = new Map<string, number>();
  for (const t of tarefas) {
    if (!t.tipo) continue;
    tipoMap.set(t.tipo, (tipoMap.get(t.tipo) ?? 0) + 1);
  }
  const tipoData = [...tipoMap.entries()]
    .map(([tipo, count]) => ({ tipo, count }))
    .sort((a, b) => b.count - a.count);

  const valorMensal = buildValorMensal(tarefas);
  const topClientes = topClientesPorValor(tarefas);

  return (
    <>
      <Topbar
        title="Relatórios"
        description="Métricas e distribuições."
        syncedAt={meta?.updatedAt}
        syncCount={meta?.count}
      />

      <div className="px-6 lg:px-8 py-8 space-y-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Valor estimado activo"
            value={`${valorTotalActivo.toFixed(0)}€`}
            icon={Euro}
            tone="default"
            hint={`${activas.length} tarefas activas`}
          />
          <KpiCard
            label="Tarefas totais"
            value={tarefas.length}
            icon={ListChecks}
            tone="accent"
          />
          <KpiCard
            label="Clientes únicos"
            value={clientesUnique.size}
            icon={Users}
            tone="green"
          />
          <KpiCard
            label="Concluídas/arquivo"
            value={
              tarefas.filter(
                (t) =>
                  STATUS_GROUPS.arquivo.includes(t.status as TarefaStatus) ||
                  STATUS_GROUPS.pronto.includes(t.status as TarefaStatus)
              ).length
            }
            icon={Clock}
            tone="default"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-lg border border-border bg-surface p-6">
            <h2 className="font-headline text-lg font-semibold mb-1">Por estado</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Distribuição actual de tarefas.
            </p>
            <StatusPie data={statusData} />
          </article>

          <article className="rounded-lg border border-border bg-surface p-6">
            <h2 className="font-headline text-lg font-semibold mb-1">Por tipo</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Categorias de trabalho mais frequentes.
            </p>
            <TipoBar data={tipoData} />
          </article>

          <article className="rounded-lg border border-border bg-surface p-6 lg:col-span-2">
            <h2 className="font-headline text-lg font-semibold mb-1">Valor estimado por mês</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Soma dos `valor-estimado` por mês de criação (últimos 12 meses com dados).
            </p>
            <ValorMensal data={valorMensal} />
          </article>

          <article className="rounded-lg border border-border bg-surface p-6 lg:col-span-2">
            <h2 className="font-headline text-lg font-semibold mb-4">Top 5 clientes por valor</h2>
            {topClientes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados de valor estimado por cliente.</p>
            ) : (
              <ol className="space-y-2">
                {topClientes.map((c, i) => (
                  <li
                    key={c.cliente}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-4 py-3"
                  >
                    <span className="inline-flex items-center gap-3">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold tabular-nums">
                        {i + 1}
                      </span>
                      <span className="font-medium text-foreground">{c.cliente}</span>
                    </span>
                    <span className="font-headline text-base font-semibold tabular-nums">
                      {c.valor.toFixed(0)}€
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </article>
        </div>
      </div>
    </>
  );
}
