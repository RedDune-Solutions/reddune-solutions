import type { Metadata } from "next";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { getLocale } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageHero } from "@/components/sections/PageHero";
import { ContactForm } from "@/components/sections/ContactForm";
import { ContactInfo } from "@/components/sections/ContactInfo";
import { Reveal } from "@/components/motion/Reveal";
import { publicEnv } from "@/lib/env";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const base = publicEnv.baseUrl;
  const isPt = locale !== "en";

  const title = isPt
    ? "Contacto - RedDune Solutions"
    : "Contact - RedDune Solutions";
  const description = isPt
    ? "Entre em contacto com a RedDune Solutions para orçamentos, suporte técnico ou dúvidas sobre produtos. Respondemos rapidamente."
    : "Contact RedDune Solutions for quotes, technical support or product enquiries. We respond quickly.";

  return {
    title,
    description,
    keywords: isPt
      ? ["contacto RedDune Solutions", "suporte técnico", "orçamento informático", "Fuseta", "Algarve"]
      : ["contact RedDune Solutions", "technical support", "IT quote", "Fuseta", "Algarve"],
    alternates: {
      canonical: `${base}/contacto`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale,
      url: `${base}/contacto`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

function ContactHero() {
  const t = useTranslations("HomePage.ContactSection");
  return (
    <PageHero
      eyebrow={t.has("eyebrow") ? t("eyebrow") : "Resposta em < 24h · Fuseta, Algarve"}
      title={t.rich("title", {
        accent: (chunks) => <em>{chunks}</em>,
      })}
      description={t("description")}
    />
  );
}

function FormBlock() {
  const t = useTranslations("HomePage.ContactSection");
  return (
    <section className="relative mx-auto w-full max-w-content px-8 py-16 md:py-24">
      <Reveal>
        <span
          className={cn(
            "inline-flex items-center gap-[10px]",
            "rounded-btn border border-ember/20 bg-ember/[0.08]",
            "px-[14px] py-[6px] mb-7",
            "font-mono text-[11px] uppercase tracking-[0.2em] text-ember",
          )}
        >
          <span aria-hidden="true" className="block h-1.5 w-1.5 rounded-sm bg-ember" />
          {t.has("formEyebrow")
            ? t("formEyebrow")
            : "Formulário de contacto"}
        </span>
      </Reveal>
      <Reveal>
        <h2
          className={cn(
            "font-display font-bold text-ink max-w-[1000px] mb-6",
            "text-[clamp(32px,4.8vw,68px)] leading-[1.05] tracking-[-0.03em]",
            "[&_em]:font-serif [&_em]:italic [&_em]:font-medium [&_em]:text-ember",
          )}
        >
          {t.has("formTitle")
            ? t.rich("formTitle", {
                accent: (chunks) => <em>{chunks}</em>,
              })
            : t("form.title")}
        </h2>
      </Reveal>

      <div className={cn(
        "grid gap-8 mt-10",
        "grid-cols-1 lg:grid-cols-[1.4fr_1fr]",
      )}>
        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
        <ContactInfo />
      </div>
    </section>
  );
}

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main id="main" className="flex-grow">
        <ContactHero />
        <FormBlock />
      </main>
      <Footer />
    </div>
  );
}
