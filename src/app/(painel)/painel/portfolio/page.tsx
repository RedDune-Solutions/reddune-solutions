import { getAllPortfolioItems } from "@/lib/mongodb/portfolio";
import { PortfolioClient } from "@/components/painel/PortfolioClient";
import { requirePainelSession } from "@/lib/painel-auth";

export const dynamic = "force-dynamic";

export default async function PortfolioAdminPage() {
  await requirePainelSession();
  const items = await getAllPortfolioItems({ includeHidden: true });
  return <PortfolioClient items={items} />;
}
