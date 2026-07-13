import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllPortfolioItems } from "@/lib/mongodb/portfolio";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await getAllPortfolioItems({ includeHidden: true });
  return NextResponse.json(items);
}
