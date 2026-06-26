import { validateContact } from "@/lib/validation";
import { rateLimitDistributed, getClientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { randomUUID } from "node:crypto";
import { createLead } from "@/lib/mongodb/leads";

export const dynamic = "force-dynamic";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

// Formulário de contacto do site público. Já NÃO envia email — grava a
// submissão como lead em `/painel/leads`. Mantém rate-limit + honeypot +
// Turnstile + validação. Como o lead é agora o único canal, uma falha a gravar
// devolve erro (antes era best-effort porque o email era o canal principal).
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await rateLimitDistributed(
    `sendEmail:${ip}`,
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_MS
  );
  if (!rl.allowed) {
    return Response.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((rl.resetAt - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot — bots fill every visible field. Silent 200 fakes success.
  if (
    body &&
    typeof body === "object" &&
    typeof (body as Record<string, unknown>).website === "string" &&
    (body as Record<string, unknown>).website !== ""
  ) {
    return Response.json({ id: "ok" });
  }

  // CAPTCHA — verified only when Turnstile is configured (otherwise skipped).
  const captchaToken =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).turnstileToken
      : undefined;
  const captchaOk = await verifyTurnstile(
    typeof captchaToken === "string" ? captchaToken : null,
    ip
  );
  if (!captchaOk) {
    return Response.json(
      { error: "Verificação anti-spam falhou. Tenta novamente." },
      { status: 403 }
    );
  }

  const result = validateContact(body);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  const { name, email, subject, message } = result.data;

  try {
    const now = new Date().toISOString();
    await createLead({
      id: randomUUID(),
      nome: name,
      email,
      subject,
      mensagem: message,
      origem: "contact-form",
      estado: "novo",
      notas: null,
      clienteId: null,
      criadoEm: now,
      atualizadoEm: now,
    });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("Falha a guardar lead:", e);
    return Response.json(
      { error: "Não foi possível guardar. Tenta novamente." },
      { status: 500 }
    );
  }
}
