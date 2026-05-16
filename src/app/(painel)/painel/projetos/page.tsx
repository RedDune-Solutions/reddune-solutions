import Link from "next/link";
import { getAllProjetos } from "@/lib/mongodb/projetos";
import { getAllClientes } from "@/lib/mongodb/clientes";
import { Topbar } from "@/components/painel/Topbar";
import { StatusBadge } from "@/components/painel/StatusBadge";
import { NovaTarefaButton } from "@/components/painel/NovaTarefaButton";
import { GlobalSearch } from "@/components/painel/GlobalSearch";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string }>;

export default async function ProjetosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [allProjetos, clientes, params] = await Promise.all([
    getAllProjetos(),
    getAllClientes(),
    searchParams,
  ]);

  const q = params.q?.trim().toLowerCase() ?? "";
  const projetos = q
    ? allProjetos.filter(
        (p) =>
          p.titulo.toLowerCase().includes(q) ||
          (p.clienteNome?.toLowerCase().includes(q) ?? false)
      )
    : allProjetos;

  return (
    <>
      <Topbar
        title="Projectos"
        description="Todos os projectos registados."
      />

      <div className="px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <GlobalSearch defaultValue={params.q} />
          <NovaTarefaButton clientes={clientes} />
        </div>

        {projetos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {q ? `Sem resultados para "${params.q}".` : "Sem projectos ainda."}
          </p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Projecto</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Cliente</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Prazo</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Tipo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projetos.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/painel/projetos/${p.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {p.titulo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {p.clienteNome ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground tabular-nums">
                      {p.prazo
                        ? new Date(p.prazo).toLocaleDateString("pt-PT", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground capitalize">
                      {p.tipo?.replace("-", " ") ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
