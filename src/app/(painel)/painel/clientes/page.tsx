import Link from "next/link";
import { Users, ArrowUpRight, FileText } from "lucide-react";
import { getAllClientes } from "@/lib/mongodb/clientes";
import { getAllTarefas, getSyncMeta } from "@/lib/mongodb/tarefas";
import { Topbar } from "@/components/painel/Topbar";
import { KpiCard } from "@/components/painel/KpiCard";
import { STATUS_GROUPS } from "@/types/tarefa";
import { clienteToSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const [clientes, tarefas, meta] = await Promise.all([
    getAllClientes(),
    getAllTarefas(),
    getSyncMeta(),
  ]);

  const tarefaCountByNome = new Map<string, { total: number; ativas: number }>();
  for (const t of tarefas) {
    if (!t.cliente) continue;
    const key = t.cliente.trim().toLowerCase();
    const existing = tarefaCountByNome.get(key) ?? { total: 0, ativas: 0 };
    existing.total += 1;
    if (
      STATUS_GROUPS.ativo.includes(t.status) ||
      STATUS_GROUPS.proximo.includes(t.status) ||
      STATUS_GROUPS.aguarda.includes(t.status)
    ) {
      existing.ativas += 1;
    }
    tarefaCountByNome.set(key, existing);
  }

  const sorted = [...clientes].sort((a, b) => {
    const nomeA = String(a.nome ?? a.sourcePath ?? "");
    const nomeB = String(b.nome ?? b.sourcePath ?? "");
    return nomeA.localeCompare(nomeB, "pt");
  });

  const comProjetos = sorted.filter((c) => {
    const nome = String(c.nome ?? "").trim().toLowerCase();
    return (tarefaCountByNome.get(nome)?.total ?? 0) > 0;
  }).length;

  return (
    <>
      <Topbar
        title="Clientes"
        description={`${clientes.length} ficha${clientes.length === 1 ? "" : "s"} sincronizadas do Obsidian.`}
        syncedAt={meta?.updatedAt}
        syncCount={meta?.count}
      />

      <div className="px-6 lg:px-8 py-8 space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard label="Total de clientes" value={clientes.length} icon={Users} tone="default" />
          <KpiCard label="Com projectos activos" value={comProjetos} icon={FileText} tone="accent" />
        </div>

        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sem fichas de clientes. Corre o sync do Obsidian para importar a pasta{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">01_Clientes (Fichas)</code>.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sorted.map((cliente, idx) => {
              const nome = String(cliente.nome ?? "").trim();
              const nomeKey = nome.toLowerCase();
              const counts = tarefaCountByNome.get(nomeKey);
              const displayName =
                (nome || String(cliente.sourcePath).split("/").pop()?.replace(".md", "")) ?? "—";

              const slug = clienteToSlug(displayName);
              return (
                <Link
                  key={String(cliente.sourcePath ?? idx)}
                  href={`/painel/clientes/${slug}`}
                  className="group relative flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-5 transition-all duration-300 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-headline text-base font-semibold text-foreground leading-tight truncate">
                      {displayName}
                    </h3>
                    {typeof cliente.email === "string" && cliente.email && (
                      <p className="mt-1 text-xs text-muted-foreground truncate">
                        {cliente.email}
                      </p>
                    )}
                    {typeof cliente.nif !== "undefined" && cliente.nif !== null && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        NIF: {String(cliente.nif)}
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
