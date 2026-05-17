import { Euro, Clock, ListChecks, Users } from "lucide-react";
import { getAllProjetos } from "@/lib/mongodb/projetos";
import { getAllClientes } from "@/lib/mongodb/clientes";
import { getAllPagamentos } from "@/lib/mongodb/pagamentos";
import type { Pagamento } from "@/types/pagamento";
import { Topbar } from "@/components/painel/Topbar";
import { KpiCard } from "@/components/painel/KpiCard";
import { StatusPie } from "@/components/painel/charts/StatusPie";
import { TipoBar } from "@/components/painel/charts/TipoBar";
import { ValorMensal } from "@/components/painel/charts/ValorMensal";
import { STATUS_GROUPS, PROJETO_STATUS, type ProjetoStatus, type Projeto } from "@/types/projeto";

export const dynamic = "force-dynamic";

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function buildValorMensal(projetos: Projeto[]): Array<{ mes: string; valor: number }> {
  const map = new Map<string, number>();
  for (const p of projetos) {
    if (!p.dataCriado || !p.valorEstimado) continue;
    const key = monthKey(p.dataCriado);
    map.set(key, (map.get(key) ?? 0) + p.valorEstimado);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([mes, valor]) => ({ mes, valor }));
}

function topClientesPorValorPago(
  pagamentos: Pagamento[],
  clientesMap: Map<string, string>
): Array<{ cliente: string; valor: number }> {
  const map = new Map<string, number>();
  for (const p of pagamentos) {
    if (!p.clienteId) continue;
    map.set(p.clienteId, (map.get(p.clienteId) ?? 0) + p.valor);
  }
  return [...map.entries()]
    .map(([id, valor]) => ({ cliente: clientesMap.get(id) ?? "(sem nome)", valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);
}

export default async function RelatoriosPage() {
  const [projetos, clientes, pagamentos] = await Promise.all([
    getAllProjetos(),
    getAllClientes(),
    getAllPagamentos(),
  ]);

  const clientesMap = new Map(clientes.map((c) => [c.id, c.nome]));

  const activos = projetos.filter(
    (p) =>
      STATUS_GROUPS.ativo.includes(p.status) ||
      STATUS_GROUPS.proximo.includes(p.status) ||
      STATUS_GROUPS.aguarda.includes(p.status) ||
      STATUS_GROUPS.pronto.includes(p.status)
  );

  const valorTotalActivo = activos.reduce((s, p) => s + (p.valorEstimado ?? 0), 0);

  const statusData = PROJETO_STATUS.map((status) => ({
    status,
    count: projetos.filter((p) => p.status === status).length,
  }));

  const tipoMap = new Map<string, number>();
  for (const p of projetos) {
    if (!p.tipo) continue;
    tipoMap.set(p.tipo, (tipoMap.get(p.tipo) ?? 0) + 1);
  }
  const tipoData = [...tipoMap.entries()]
    .map(([tipo, count]) => ({ tipo, count }))
    .sort((a, b) => b.count - a.count);

  const valorMensal = buildValorMensal(projetos);
  const topClientes = topClientesPorValorPago(pagamentos, clientesMap);

  return (
    <>
      <Topbar title="Relatórios" description="Métricas e distribuições." />

      <div className="px-6 lg:px-8 py-8 space-y-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Valor estimado activo"
            value={`${valorTotalActivo.toFixed(0)}€`}
            icon={Euro}
            tone="default"
            hint={`${activos.length} projectos activos`}
          />
          <KpiCard
            label="Projectos totais"
            value={projetos.length}
            icon={ListChecks}
            tone="accent"
          />
          <KpiCard
            label="Clientes"
            value={clientes.length}
            icon={Users}
            tone="green"
          />
          <KpiCard
            label="Concluídos/arquivo"
            value={
              projetos.filter(
                (p) =>
                  STATUS_GROUPS.arquivo.includes(p.status as ProjetoStatus) ||
                  STATUS_GROUPS.pronto.includes(p.status as ProjetoStatus)
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
              Distribuição actual de projectos.
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
              Soma do valor estimado por mês de criação (últimos 12 meses com dados).
            </p>
            <ValorMensal data={valorMensal} />
          </article>

          <article className="rounded-lg border border-border bg-surface p-6 lg:col-span-2">
            <h2 className="font-headline text-lg font-semibold mb-4">Top 5 clientes por valor pago</h2>
            {topClientes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem pagamentos registados.</p>
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
