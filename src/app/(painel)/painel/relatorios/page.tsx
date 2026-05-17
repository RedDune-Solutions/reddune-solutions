import { Euro, Clock, ListChecks, Users, AlertCircle, Hourglass } from "lucide-react";
import { getAllProjetos } from "@/lib/mongodb/projetos";
import { getAllClientes } from "@/lib/mongodb/clientes";
import { getAllPagamentos } from "@/lib/mongodb/pagamentos";
import { METODO_LABEL, type MetodoPagamento, type Pagamento } from "@/types/pagamento";
import { Topbar } from "@/components/painel/Topbar";
import { KpiCard } from "@/components/painel/KpiCard";
import { StatusPie } from "@/components/painel/charts/StatusPie";
import { TipoBar } from "@/components/painel/charts/TipoBar";
import { ValorMensal } from "@/components/painel/charts/ValorMensal";
import { PagamentosPorMetodo } from "@/components/painel/charts/PagamentosPorMetodo";
import { ProjetosPorMes } from "@/components/painel/charts/ProjetosPorMes";
import { STATUS_GROUPS, PROJETO_STATUS, type ProjetoStatus, type Projeto } from "@/types/projeto";

export const dynamic = "force-dynamic";

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function buildValorMensal(
  projetos: Projeto[],
  pagamentos: Pagamento[]
): Array<{ mes: string; estimado: number; pago: number }> {
  const map = new Map<string, { estimado: number; pago: number }>();
  const ensure = (k: string) => {
    if (!map.has(k)) map.set(k, { estimado: 0, pago: 0 });
    return map.get(k)!;
  };
  for (const p of projetos) {
    if (!p.dataCriado || !p.valorEstimado) continue;
    if (p.status === "aguardando-cliente") continue; // não conta — orçamento não aceite
    ensure(monthKey(p.dataCriado)).estimado += p.valorEstimado;
  }
  for (const pg of pagamentos) {
    if (!pg.data || !pg.valor) continue;
    ensure(monthKey(pg.data)).pago += pg.valor;
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([mes, v]) => ({ mes, ...v }));
}

function buildPagamentosPorMetodo(pagamentos: Pagamento[]) {
  const map = new Map<string, { valor: number; count: number }>();
  for (const pg of pagamentos) {
    const k = (pg.metodo ?? "outro") as MetodoPagamento;
    const cur = map.get(k) ?? { valor: 0, count: 0 };
    cur.valor += pg.valor;
    cur.count += 1;
    map.set(k, cur);
  }
  return [...map.entries()].map(([metodo, v]) => ({
    metodo: METODO_LABEL[metodo as MetodoPagamento] ?? metodo,
    ...v,
  }));
}

function buildProjetosPorMes(projetos: Projeto[]) {
  const map = new Map<string, { criados: number; fechados: number }>();
  const ensure = (k: string) => {
    if (!map.has(k)) map.set(k, { criados: 0, fechados: 0 });
    return map.get(k)!;
  };
  for (const p of projetos) {
    if (p.dataCriado) ensure(monthKey(p.dataCriado)).criados += 1;
    if (p.dataFechado) ensure(monthKey(p.dataFechado)).fechados += 1;
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([mes, v]) => ({ mes, ...v }));
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

  // Activos: em-curso, proximo, aguarda-encomenda (aceite) e terminado (entregue, falta pagar).
  // Exclui aguarda-cliente (orcamento nao aceite ainda).
  const activos = projetos.filter(
    (p) =>
      STATUS_GROUPS.ativo.includes(p.status) ||
      STATUS_GROUPS.proximo.includes(p.status) ||
      STATUS_GROUPS.aguardaEncomenda.includes(p.status) ||
      STATUS_GROUPS.pronto.includes(p.status)
  );

  const comprometidos = projetos.filter((p) =>
    STATUS_GROUPS.comprometido.includes(p.status)
  );
  const valorTotalActivo = comprometidos.reduce((s, p) => s + (p.valorEstimado ?? 0), 0);

  const aguardaCliente = projetos.filter((p) => p.status === "aguardando-cliente");
  const valorPotencial = aguardaCliente.reduce((s, p) => s + (p.valorEstimado ?? 0), 0);

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

  const valorMensal = buildValorMensal(projetos, pagamentos);
  const pagamentosPorMetodo = buildPagamentosPorMetodo(pagamentos);
  const projetosPorMes = buildProjetosPorMes(projetos);
  const topClientes = topClientesPorValorPago(pagamentos, clientesMap);

  const valorPagoTotal = pagamentos.reduce((s, p) => s + p.valor, 0);
  const pagoPorProjeto = new Map<string, number>();
  for (const pg of pagamentos) {
    pagoPorProjeto.set(pg.projetoId, (pagoPorProjeto.get(pg.projetoId) ?? 0) + pg.valor);
  }
  const emDivida = projetos
    .filter((p) => STATUS_GROUPS.pronto.includes(p.status))
    .reduce((s, p) => {
      const pago = pagoPorProjeto.get(p.id) ?? 0;
      return s + Math.max(0, (p.valorEstimado ?? 0) - pago);
    }, 0);

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
            hint={`${comprometidos.length} compromissos`}
          />
          <KpiCard
            label="A aguardar cliente"
            value={`${valorPotencial.toFixed(0)}€`}
            icon={Hourglass}
            tone="default"
            hint={`${aguardaCliente.length} orçamentos pendentes`}
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
          <KpiCard
            label="Valor recebido total"
            value={`${valorPagoTotal.toFixed(0)}€`}
            icon={Euro}
            tone="green"
          />
          <KpiCard
            label="Em dívida"
            value={`${emDivida.toFixed(0)}€`}
            icon={AlertCircle}
            tone="accent"
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
            <h2 className="font-headline text-lg font-semibold mb-1">Valor por mês: estimado vs pago</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Estimado por mês de criação; pago por data do pagamento (últimos 12 meses).
            </p>
            <ValorMensal data={valorMensal} />
          </article>

          <article className="rounded-lg border border-border bg-surface p-6">
            <h2 className="font-headline text-lg font-semibold mb-1">Pagamentos por método</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Total recebido por método de pagamento.
            </p>
            <PagamentosPorMetodo data={pagamentosPorMetodo} />
          </article>

          <article className="rounded-lg border border-border bg-surface p-6">
            <h2 className="font-headline text-lg font-semibold mb-1">Projectos por mês</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Criados vs fechados (últimos 12 meses).
            </p>
            <ProjetosPorMes data={projetosPorMes} />
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
