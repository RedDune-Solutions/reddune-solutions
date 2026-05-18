import { Topbar } from "@/components/painel/Topbar";
import { TabOrderSettings } from "@/components/painel/TabOrderSettings";

export const dynamic = "force-dynamic";

export default function DefinicoesPage() {
  return (
    <>
      <Topbar title="Definições" description="Personaliza o teu painel." />
      <div className="px-6 lg:px-8 py-8 space-y-8 max-w-2xl">
        <section className="rounded-xl border border-border-strong bg-card p-6 space-y-4">
          <header>
            <h2 className="font-headline text-lg font-semibold">Ordem das tabs</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Reordena as tabs do menu lateral. Guardado no dispositivo actual.
            </p>
          </header>
          <TabOrderSettings />
        </section>
      </div>
    </>
  );
}
