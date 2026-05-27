import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB safety net (compressão client deve trazer < 500KB)
const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rl = rateLimit(`upload-image:${ip}`, 20, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many uploads" }, { status: 429 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Storage não configurado (BLOB_READ_WRITE_TOKEN em falta)" },
      { status: 500 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Campo 'file' em falta" }, { status: 400 });
  }

  if (!ALLOWED_MIMES.has(file.type)) {
    return NextResponse.json(
      { error: `Tipo não suportado (${file.type || "desconhecido"})` },
      { status: 415 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Ficheiro demasiado grande (${Math.round(file.size / 1024)}KB > 5MB)` },
      { status: 413 }
    );
  }

  const ext = EXT_BY_MIME[file.type] ?? "bin";
  const pathname = `products/${randomUUID()}.${ext}`;

  try {
    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });
    return NextResponse.json({ url: blob.url, pathname: blob.pathname });
  } catch (err) {
    console.error("Blob put failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload falhou" },
      { status: 500 }
    );
  }
}
