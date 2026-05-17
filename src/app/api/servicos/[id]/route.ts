import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteServico } from "@/lib/mongodb/servicos";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const ok = await deleteServico(id);
  return NextResponse.json({ ok });
}
