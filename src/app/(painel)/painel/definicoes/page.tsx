import { Topbar } from "@/components/painel/Topbar";
import { TabOrderSettings } from "@/components/painel/TabOrderSettings";
import { KanbanOrderSettings } from "@/components/painel/KanbanOrderSettings";

export const dynamic = "force-dynamic";

export default async function DefinicoesPage() {
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
            <h2 className="font-headline text-lg font-semibold">Ordem das colunas Kanban</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Reordena as colunas da vista Kanban. Guardado no dispositivo actual.
            </p>
          </header>
          <KanbanOrderSettings />
        </section>
      </div>
    </>
  );
}
