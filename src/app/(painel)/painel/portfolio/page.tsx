import { getAllPortfolioItems } from "@/lib/mongodb/portfolio";
import { PortfolioClient } from "@/components/painel/PortfolioClient";

export const dynamic = "force-dynamic";

export default async function PortfolioAdminPage() {
  const items = await getAllPortfolioItems({ includeHidden: true });
  return <PortfolioClient items={items} />;
}
