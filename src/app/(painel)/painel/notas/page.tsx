import { getAllNotas } from "@/lib/mongodb/notas";
import { Topbar } from "@/components/painel/Topbar";
import { NotasClient } from "@/components/painel/NotasClient";

export const dynamic = "force-dynamic";

export default async function NotasPage() {
  const notas = await getAllNotas();

  return (
    <>
      <Topbar title="Notas" description="Textos e referências de consulta rápida." />
      <div className="px-6 lg:px-8 py-8">
        <NotasClient notas={notas} />
      </div>
    </>
  );
}
