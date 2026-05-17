import Link from "next/link";
import { Users, ArrowUpRight, FileText } from "lucide-react";
import { getAllClientes } from "@/lib/mongodb/clientes";
import { getAllProjetos } from "@/lib/mongodb/projetos";
import { Topbar } from "@/components/painel/Topbar";
import { KpiCard } from "@/components/painel/KpiCard";
import { NovoClienteButton } from "@/components/painel/NovoClienteButton";
import { STATUS_GROUPS } from "@/types/projeto";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const [clientes, projetos] = await Promise.all([
    getAllClientes(),
    getAllProjetos(),
  ]);

  const projetoCountByCliente = new Map<string, { total: number; ativas: number }>();
  for (const p of projetos) {
    if (!p.clienteId) continue;
    const existing = projetoCountByCliente.get(p.clienteId) ?? { total: 0, ativas: 0 };
    existing.total += 1;
    if (
      STATUS_GROUPS.ativo.includes(p.status) ||
      STATUS_GROUPS.proximo.includes(p.status) ||
      STATUS_GROUPS.aguarda.includes(p.status)
    ) {
      existing.ativas += 1;
    }
    projetoCountByCliente.set(p.clienteId, existing);
  }

  const sorted = [...clientes].sort((a, b) =>
    String(a.nome).localeCompare(String(b.nome), "pt")
  );

  const comProjetos = sorted.filter(
    (c) => (projetoCountByCliente.get(c.id)?.ativas ?? 0) > 0
  ).length;

  return (
    <>
      <Topbar
        title="Clientes"
        description={`${clientes.length} cliente${clientes.length === 1 ? "" : "s"} registado${clientes.length === 1 ? "" : "s"}.`}
      />

      <div className="px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="grid gap-4 sm:grid-cols-2">
            <KpiCard label="Total de clientes" value={clientes.length} icon={Users} tone="default" />
            <KpiCard label="Com projectos activos" value={comProjetos} icon={FileText} tone="accent" />
          </div>
          <NovoClienteButton />
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-cream/30 px-6 py-16 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <h2 className="mt-4 font-headline text-2xl font-semibold tracking-tight">
              Sem clientes
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Clica em <strong>Novo cliente</strong> para adicionar o primeiro.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sorted.map((cliente) => {
              const counts = projetoCountByCliente.get(cliente.id);
              return (
                <Link
                  key={cliente.id}
                  href={`/painel/clientes/${cliente.id}`}
                  className="group relative flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-5 transition-all duration-300 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-headline text-base font-semibold text-foreground leading-tight truncate">
                      {cliente.nome}
                    </h3>
                    {cliente.email && (
                      <p className="mt-1 text-xs text-muted-foreground truncate">
                        {cliente.email}
                      </p>
                    )}
                    {cliente.nif && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        NIF: {cliente.nif}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                      {counts?.total ?? 0} projecto{(counts?.total ?? 0) === 1 ? "" : "s"}
                      {(counts?.ativas ?? 0) > 0 && (
                        <span className="ml-2 text-accent">
                          · {counts!.ativas} activo{counts!.ativas === 1 ? "" : "s"}
                        </span>
                      )}
                    </p>
                  </div>
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-all duration-300 group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
