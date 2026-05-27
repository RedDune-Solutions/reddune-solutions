import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllProjetoTiposCustom } from "@/lib/mongodb/projeto-tipos-custom";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tipos = await getAllProjetoTiposCustom();
    return NextResponse.json(tipos);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
