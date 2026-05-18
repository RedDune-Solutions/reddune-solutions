import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllTarefaTemplates } from "@/lib/mongodb/tarefa-templates";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const templates = await getAllTarefaTemplates();
    return NextResponse.json(templates);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
