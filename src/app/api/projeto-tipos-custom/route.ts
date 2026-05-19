import { NextResponse } from "next/server";
import { getAllProjetoTiposCustom } from "@/lib/mongodb/projeto-tipos-custom";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tipos = await getAllProjetoTiposCustom();
    return NextResponse.json(tipos);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
