import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deletePagamento } from "@/lib/mongodb/pagamentos";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const ok = await deletePagamento(id);
  return NextResponse.json({ ok });
}
