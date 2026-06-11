import { EmailTemplate } from "@/components/templates/email-template";
import { render } from "@react-email/render";
import { validateContact, SUBJECT_LABELS } from "@/lib/validation";
import { businessEmail } from "@/config/contact";
import { getResend } from "@/lib/resend";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`sendEmail:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
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

  const result = validateContact(body);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  const { name, email, subject, message } = result.data;
  const subjectLabel = SUBJECT_LABELS[subject];

  try {
    const emailHtml = await render(
      EmailTemplate({ name, email, subject: subjectLabel, message })
    );

    const { data, error } = await getResend().emails.send({
      from: "Website Form <onboarding@resend.dev>",
      to: businessEmail,
      subject: `Contacto: ${subjectLabel}`,
      replyTo: email,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend error:", error);
      return Response.json({ error: "Failed to send email" }, { status: 502 });
    }

    return Response.json({ id: data?.id });
  } catch (error) {
    console.error("sendEmail error:", error);
    return Response.json({ error: "Failed to send email" }, { status: 500 });
  }
}
