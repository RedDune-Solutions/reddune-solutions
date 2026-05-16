import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteCliente } from "@/lib/mongodb/clientes";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const ok = await deleteCliente(id);
  if (!ok) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
