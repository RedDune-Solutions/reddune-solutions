import { NextResponse } from "next/server";
import { deleteProjetoTipoCustom } from "@/lib/mongodb/projeto-tipos-custom";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function DELETE(_req: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const deleted = await deleteProjetoTipoCustom(id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
