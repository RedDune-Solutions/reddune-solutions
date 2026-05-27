import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteManagedBlob } from "@/lib/blob";

export const dynamic = "force-dynamic";

/**
 * Apaga blob via URL (POST body) em vez de path-param para evitar problemas
 * de URL encoding com caracteres dos pathnames Vercel Blob.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const url = String(body.url ?? "").trim();
  if (!url) {
    return NextResponse.json({ error: "URL em falta" }, { status: 400 });
  }

  await deleteManagedBlob(url);
  return NextResponse.json({ ok: true });
}
