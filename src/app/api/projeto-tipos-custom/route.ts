import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllProjetoTiposCustom } from "@/lib/mongodb/projeto-tipos-custom";
import { getBaseTiposRemovidos } from "@/lib/mongodb/projeto-tipos-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [custom, baseRemovidos] = await Promise.all([
      getAllProjetoTiposCustom(),
      getBaseTiposRemovidos(),
    ]);
    return NextResponse.json({ custom, baseRemovidos });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
