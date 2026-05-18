import { Topbar } from "@/components/painel/Topbar";
import { TabOrderSettings } from "@/components/painel/TabOrderSettings";
import { TemplatesEditor } from "@/components/painel/TemplatesEditor";
import { getAllTarefaTemplates } from "@/lib/mongodb/tarefa-templates";

export const dynamic = "force-dynamic";

export default async function DefinicoesPage() {
  const templates = await getAllTarefaTemplates();

  return (
    <>
      <Topbar title="Definições" description="Personaliza o teu painel." />
      <div className="px-6 lg:px-8 py-8 space-y-8 max-w-3xl">
        <section className="rounded-xl border border-border-strong bg-card p-6 space-y-4">
          <header>
            <h2 className="font-headline text-lg font-semibold">Ordem das tabs</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Reordena as tabs do menu lateral. Guardado no dispositivo actual.
            </p>
          </header>
          <TabOrderSettings />
        </section>

        <section className="rounded-xl border border-border-strong bg-card p-6 space-y-4">
          <header>
            <h2 className="font-headline text-lg font-semibold">Templates de tarefas</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Conjuntos de tarefas reutilizáveis. Aplica-os ao criar/editar um projecto.
            </p>
          </header>
          <TemplatesEditor templates={templates} />
        </section>
      </div>
    </>
  );
}
