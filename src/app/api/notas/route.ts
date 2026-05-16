import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllNotas } from "@/lib/mongodb/notas";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notas = await getAllNotas();
  return NextResponse.json(notas);
}
