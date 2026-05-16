import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllProductsAdmin } from "@/lib/mongodb/products";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await getAllProductsAdmin();
  return NextResponse.json(products);
}
