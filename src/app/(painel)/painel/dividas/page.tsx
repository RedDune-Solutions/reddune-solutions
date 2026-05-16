import { AlertTriangle } from "lucide-react";
import { getAllTarefas, getSyncMeta } from "@/lib/mongodb/tarefas";
import { Topbar } from "@/components/painel/Topbar";
import { TarefasTable } from "@/components/painel/TarefasTable";
import { KpiCard } from "@/components/painel/KpiCard";

export const dynamic = "force-dynamic";

export default async function DividasPage() {
  const [allTarefas, meta] = await Promise.all([getAllTarefas(), getSyncMeta()]);

  const dividas = allTarefas.filter((t) => t.status === "em-divida");
  const totalValor = dividas.reduce((sum, t) => sum + (t.valorEstimado ?? 0), 0);

  return (
    <>
      <Topbar
        title="Em dívida"
        description={`${dividas.length} projecto${dividas.length === 1 ? "" : "s"} com pagamento pendente.`}
        syncedAt={meta?.updatedAt}
        syncCount={meta?.count}
      />

      <div className="px-6 lg:px-8 py-8 space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            label="Em dívida"
            value={dividas.length}
            icon={AlertTriangle}
            tone="amber"
            hint="Projectos por cobrar"
          />
          <KpiCard
            label="Valor total estimado"
            value={
              totalValor > 0
                ? `${totalValor.toLocaleString("pt-PT", { minimumFractionDigits: 2 })} €`
                : "—"
            }
            icon={AlertTriangle}
            tone="default"
            hint="Soma de valorEstimado"
          />
        </div>

        {dividas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-cream/30 px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Sem projectos em dívida. Usa o status{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">em-divida</code> no
              Obsidian para marcar projectos por cobrar.
            </p>
          </div>
        ) : (
          <TarefasTable tarefas={dividas} />
        )}
      </div>
    </>
  );
}
