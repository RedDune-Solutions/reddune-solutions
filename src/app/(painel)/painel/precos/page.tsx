import { ServicosEditor } from "@/components/painel/ServicosEditor";
import { getAllServicos } from "@/lib/mongodb/servicos";

export const dynamic = "force-dynamic";

export default async function PrecosPage() {
  const all = await getAllServicos();
  return <ServicosEditor servicos={all} />;
}
