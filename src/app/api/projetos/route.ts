import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllProjetos } from "@/lib/mongodb/projetos";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const projetos = await getAllProjetos();
    return NextResponse.json({ projetos }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/projetos error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
