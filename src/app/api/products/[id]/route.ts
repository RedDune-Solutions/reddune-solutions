import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteProduct } from "@/lib/mongodb/products";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ok = await deleteProduct(id);
  return NextResponse.json({ ok });
}
