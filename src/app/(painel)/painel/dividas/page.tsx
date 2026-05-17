import { AlertTriangle, Euro } from "lucide-react";
import { getAllProjetos } from "@/lib/mongodb/projetos";
import { getAllPagamentos } from "@/lib/mongodb/pagamentos";
import { Topbar } from "@/components/painel/Topbar";
import { TarefasTable } from "@/components/painel/TarefasTable";
import { KpiCard } from "@/components/painel/KpiCard";

export const dynamic = "force-dynamic";

export default async function DividasPage() {
  const [allProjetos, pagamentos] = await Promise.all([getAllProjetos(), getAllPagamentos()]);

  const pagoPorProjeto = new Map<string, number>();
  for (const p of pagamentos) {
    pagoPorProjeto.set(p.projetoId, (pagoPorProjeto.get(p.projetoId) ?? 0) + p.valor);
  }

  const dividas = allProjetos.filter((p) => {
    if (p.status !== "terminado") return false;
    if (p.valorEstimado == null) return false;
    const pago = pagoPorProjeto.get(p.id) ?? 0;
    return pago < p.valorEstimado;
  });

  const totalEmDivida = dividas.reduce(
    (sum, p) => sum + ((p.valorEstimado ?? 0) - (pagoPorProjeto.get(p.id) ?? 0)),
    0
  );

  return (
    <>
      <Topbar
        title="Em dívida"
        description={`${dividas.length} projecto${dividas.length === 1 ? "" : "s"} com pagamento pendente.`}
      />

      <div className="px-6 lg:px-8 py-8 space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            label="Em dívida"
            value={dividas.length}
            icon={AlertTriangle}
            tone="amber"
            hint="Projectos terminados por cobrar"
          />
          <KpiCard
            label="Valor por receber"
            value={
              totalEmDivida > 0
                ? `${totalEmDivida.toLocaleString("pt-PT", { minimumFractionDigits: 2 })} €`
                : "—"
            }
            icon={Euro}
            tone="default"
            hint="Diferença entre valorEstimado e pago"
          />
        </div>

        {dividas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-cream/30 px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Sem projectos em dívida. Projectos com status <code className="rounded bg-muted px-1.5 py-0.5 text-xs">terminado</code> e pagamento por completar aparecem aqui.
            </p>
          </div>
        ) : (
          <TarefasTable projetos={dividas} />
        )}
      </div>
    </>
  );
}
