import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { tarefasPayloadSchema } from "@/lib/validation-tarefa";
import {
  getAllTarefas,
  getSyncMeta,
  replaceTarefas,
} from "@/lib/mongodb/tarefas";

export const dynamic = "force-dynamic";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [tarefas, meta] = await Promise.all([getAllTarefas(), getSyncMeta()]);
    return NextResponse.json({ tarefas, meta }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("GET /api/tarefas error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const secret = process.env.SYNC_SECRET;
  if (!secret) {
    console.error("SYNC_SECRET not configured");
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (!authHeader || !timingSafeEqual(authHeader, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = tarefasPayloadSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: result.error.issues },
      { status: 400 }
    );
  }

  try {
    const meta = await replaceTarefas(result.data.tarefas);
    return NextResponse.json({ ok: true, ...meta });
  } catch (error) {
    console.error("POST /api/tarefas error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
