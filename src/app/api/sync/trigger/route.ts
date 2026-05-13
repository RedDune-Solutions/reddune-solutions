import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      {
        error:
          "Sync trigger só disponível em dev local. Em prod, corre `npm run sync:obsidian` no PC com o vault.",
      },
      { status: 503 }
    );
  }

  return new Promise<Response>((resolve) => {
    const cwd = process.cwd();
    const scriptPath = path.join(cwd, "scripts", "sync-obsidian.mjs");
    const child = spawn("node", [scriptPath], {
      cwd,
      env: process.env,
      shell: false,
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (err) => {
      resolve(
        NextResponse.json(
          { error: `Sync falhou: ${err.message}`, stdout, stderr },
          { status: 500 }
        )
      );
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve(NextResponse.json({ ok: true, stdout }));
      } else {
        resolve(
          NextResponse.json(
            { error: `Sync exit code ${code}`, stdout, stderr },
            { status: 500 }
          )
        );
      }
    });
  });
}
