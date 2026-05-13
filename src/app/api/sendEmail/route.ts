import { EmailTemplate } from "@/components/templates/email-template";
import { render } from "@react-email/render";
import { validateContact, SUBJECT_LABELS } from "@/lib/validation";
import { businessEmail } from "@/config/contact";
import { getResend } from "@/lib/resend";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
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
