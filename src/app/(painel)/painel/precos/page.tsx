import { ServicosEditor } from "@/components/painel/ServicosEditor";
import { requirePainelSession } from "@/lib/painel-auth";
import { getAllServicos } from "@/lib/mongodb/servicos";

export const dynamic = "force-dynamic";

export default async function PrecosPage() {
  await requirePainelSession();
  const all = await getAllServicos();
  return <ServicosEditor servicos={all} />;
}
