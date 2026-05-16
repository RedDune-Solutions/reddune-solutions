import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllClientes } from "@/lib/mongodb/clientes";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const clientes = await getAllClientes();
    return NextResponse.json({ clientes }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/clientes error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
