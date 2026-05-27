import { History } from "lucide-react";
import { Topbar } from "@/components/painel/Topbar";
import { getRecentAuditEntries } from "@/lib/mongodb/mutation-audit";

export const dynamic = "force-dynamic";

const OP_LABEL: Record<string, string> = {
  create: "Criou",
  update: "Editou",
  delete: "Apagou",
};

const OP_COLOR: Record<string, string> = {
  create: "bg-emerald-500/10 text-emerald-700",
  update: "bg-blue-500/10 text-blue-700",
  delete: "bg-rose-500/10 text-rose-700",
};

const COLL_LABEL: Record<string, string> = {
  projetos: "Projecto",
  clientes: "Cliente",
  tarefas: "Tarefa",
  pagamentos: "Pagamento",
  products: "Produto",
  portfolio: "Trabalho",
  servicos: "Serviço",
};

function fmtDateTime(d: Date): string {
  try {
    return new Date(d).toLocaleString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(d);
  }
}

export default async function AuditoriaPage() {
  const entries = await getRecentAuditEntries(200);

  return (
    <>
      <Topbar
        title="Auditoria"
        description={`Últimas ${entries.length} alterações registadas.`}
      />

      <div className="px-6 lg:px-8 py-8 space-y-4">
        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
            <History className="mx-auto h-8 w-8 text-muted-foreground mb-3" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Sem alterações registadas ainda. As próximas mutações aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left font-semibold px-4 py-2.5">Quando</th>
                  <th className="text-left font-semibold px-4 py-2.5">Quem</th>
                  <th className="text-left font-semibold px-4 py-2.5">Acção</th>
                  <th className="text-left font-semibold px-4 py-2.5">Recurso</th>
                  <th className="text-left font-semibold px-4 py-2.5">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((e, i) => (
                  <tr key={`${e.collection}-${e.entityId}-${i}`} className="hover:bg-muted/20">
                    <td className="px-4 py-2 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                      {fmtDateTime(e.at)}
                    </td>
                    <td className="px-4 py-2 text-xs">{e.userEmail ?? "—"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wide ${
                          OP_COLOR[e.op] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {OP_LABEL[e.op] ?? e.op}
                      </span>
                    </td>
                    <td className="px-4 py-2">{COLL_LABEL[e.collection] ?? e.collection}</td>
                    <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground truncate max-w-[200px]">
                      {e.entityId}
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
