"use client";

import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CONTACT_LIMITS,
  CONTACT_SUBJECTS,
  type ContactSubject,
  validateContact,
} from "@/lib/validation";
import { cn } from "@/lib/utils";

type SubmissionStatus = "idle" | "loading" | "success" | "error";

function resolveSubject(param: string | null): ContactSubject {
  if (param === "loja" || param === "shop") return "shop";
  if (param === "support" || param === "suporte") return "support";
  if (param === "quote" || param === "orcamento") return "quote";
  return "other";
}

/**
 * ContactForm — Phase 5d Oasis-styled contact form.
 *
 * Keeps the Resend POST → /api/sendEmail logic from the previous Contact.tsx
 * intact. Re-skinned to match `design-handoff/project/site/contacto/index.html`
 * — sand-warm field background, Geist Mono labels, ember focus ring.
 *
 * Subject is prefilled from `?subject=` query param (set by /loja
 * ProductCard CTAs).
 */
export function ContactForm() {
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [subject, setSubject] = useState<ContactSubject>("other");
  const { toast } = useToast();
  const t = useTranslations("HomePage.ContactSection");
  const searchParams = useSearchParams();

  useEffect(() => {
    const param = searchParams?.get("subject") ?? null;
    if (param) setSubject(resolveSubject(param));
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      subject,
      message: String(formData.get("message") ?? ""),
    };

    const validation = validateContact(payload);
    if (!validation.ok) {
      toast({
        title: t("useToast.errorTitle"),
        description: t("useToast.errorDescription"),
        variant: "destructive",
      });
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch("/api/sendEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      if (!response.ok) throw new Error("Request failed");

      setStatus("success");
      toast({
        title: t("useToast.successTitle"),
        description: t("useToast.successDescription"),
        variant: "success",
      });
      form.reset();
      setSubject("other");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      console.error("[ContactForm] sendEmail error:", err);
      setStatus("error");
      toast({
        title: t("useToast.errorTitle"),
        description: t("useToast.errorDescription"),
        variant: "destructive",
      });
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const isLoading = status === "loading";

  const fieldClass = cn(
    "w-full rounded-[12px] bg-sand-warm",
    "border border-dune-deep/12",
    "px-3.5 py-3",
    "font-body text-[14px] text-ink placeholder:text-ink-mute",
    "transition-colors duration-200",
    "focus:border-apricot focus:outline-none focus:ring-2 focus:ring-apricot/30",
    "disabled:opacity-60 disabled:cursor-not-allowed",
  );
  const labelClass =
    "font-mono text-[11px] uppercase tracking-[0.14em] font-semibold text-ink-mute";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn(
        "w-full",
        "rounded-card bg-cream/90 backdrop-blur",
        "border border-dune-deep/10",
        "p-7 md:p-9 shadow-warm",
      )}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className={labelClass}>{t("form.nameTitle")}</span>
          <input
            type="text"
            name="name"
            required
            minLength={CONTACT_LIMITS.nameMin}
            maxLength={CONTACT_LIMITS.nameMax}
            autoComplete="name"
            disabled={isLoading}
            placeholder={t("form.namePlaceholder")}
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelClass}>{t("form.emailTitle")}</span>
          <input
            type="email"
            name="email"
            required
            maxLength={CONTACT_LIMITS.emailMax}
            autoComplete="email"
            disabled={isLoading}
            placeholder={t("form.emailPlaceholder")}
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-2 md:col-span-2">
          <span className={labelClass}>{t("form.subjectTitle")}</span>
          <select
            name="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value as ContactSubject)}
            disabled={isLoading}
            className={cn(fieldClass, "appearance-none cursor-pointer")}
          >
            {CONTACT_SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {t(`form.subjects.${s}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 md:col-span-2">
          <span className={labelClass}>{t("form.messageTitle")}</span>
          <textarea
            name="message"
            rows={6}
            required
            minLength={CONTACT_LIMITS.messageMin}
            maxLength={CONTACT_LIMITS.messageMax}
            disabled={isLoading}
            placeholder={t("form.messagePlaceholder")}
            className={cn(fieldClass, "resize-y min-h-[140px] leading-[1.55]")}
          />
        </label>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-5">
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "group inline-flex items-center gap-3",
            "rounded-btn bg-ink px-7 py-4",
            "text-[14px] font-semibold text-cream",
            "transition-all duration-300",
            "hover:bg-ember hover:scale-[1.03]",
            "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100",
          )}
        >
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {isLoading ? t("form.submitButtonLoading") : t("form.submitButton")}
          <span
            aria-hidden="true"
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center",
              "rounded-full bg-cream text-ink text-base leading-none",
              "transition-transform duration-300",
              "group-hover:rotate-[-45deg]",
            )}
          >
            →
          </span>
        </button>
      </div>
    </form>
  );
}
