import { NextResponse } from "next/server";
import { z } from "zod";
import { replaceClientes } from "@/lib/mongodb/clientes";
import { replaceParceiros } from "@/lib/mongodb/parceiros";

export const dynamic = "force-dynamic";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

const fichaSchema = z
  .record(z.string(), z.unknown())
  .refine(
    (v) => typeof v["sourcePath"] === "string" && v["sourcePath"].length > 0,
    { message: "sourcePath is required" }
  );

const syncPayloadSchema = z.object({
  clientes: z.array(fichaSchema).max(5000),
  parceiros: z.array(fichaSchema).max(5000),
});

export async function POST(request: Request) {
  const secret = process.env.SYNC_SECRET;
  if (!secret) {
    console.error("SYNC_SECRET not configured");
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (!timingSafeEqual(authHeader, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = syncPayloadSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: result.error.issues },
      { status: 400 }
    );
  }

  try {
    type Ficha = Record<string, unknown> & { sourcePath: string };
    const [clientesMeta, parceirosMeta] = await Promise.all([
      replaceClientes(result.data.clientes as Ficha[]),
      replaceParceiros(result.data.parceiros as Ficha[]),
    ]);
    return NextResponse.json({ ok: true, clientes: clientesMeta, parceiros: parceirosMeta });
  } catch (error) {
    console.error("POST /api/sync error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
