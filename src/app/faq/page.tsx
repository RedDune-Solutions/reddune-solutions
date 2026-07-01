import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageHero } from "@/components/sections/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { ClosingCTA } from "@/components/sections/ClosingCTA";
import { getLocale, getTranslations } from "next-intl/server";
import { publicEnv } from "@/lib/env";
import { cn } from "@/lib/utils";
import { faqPageLd, jsonLdScript } from "@/lib/structured-data";

/**
 * /faq — public, indexable FAQ page (Oasis v5 design).
 *
 * Content lives in messages/{pt,en}.json under `FaqPage` and is fully editable
 * there — the `items` array of { q, a } drives both the visible accordion and
 * the schema.org FAQPage JSON-LD. Honest, generic answers for a PT tech
 * services company; no invented prices/SLAs — defers to contact where unsure.
 *
 * Mirrors the privacy-policy page (metadata/i18n/layout) and reuses the same
 * <details> accordion visual as the service sub-pages (servicos/[slug]).
 */

type FaqItem = { q: string; a: string };

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const base = publicEnv.baseUrl;
  const isPt = locale !== "en";
  const t = await getTranslations("FaqPage");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    keywords: isPt
      ? [
          "perguntas frequentes",
          "FAQ",
          "Reddune Solutions",
          "assistência técnica",
          "recuperação de dados",
          "websites",
          "Algarve",
          "Fuseta",
        ]
      : [
          "frequently asked questions",
          "FAQ",
          "Reddune Solutions",
          "tech support",
          "data recovery",
          "websites",
          "Algarve",
          "Fuseta",
        ],
    alternates: {
      canonical: `${base}/faq`,
      languages: {
        pt: `${base}/faq`,
        en: `${base}/faq`,
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
      locale,
      url: `${base}/faq`,
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
  };
}

export default async function FaqPage() {
  const t = await getTranslations("FaqPage");

  const itemsRaw = t.raw("items");
  const items: FaqItem[] = Array.isArray(itemsRaw)
    ? (itemsRaw as FaqItem[])
    : [];

  const faqSchema =
    items.length > 0
      ? faqPageLd(items.map(({ q, a }) => ({ question: q, answer: a })))
      : null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(faqSchema) }}
        />
      )}
      <main id="main" className="flex-grow">
        <PageHero
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("subtitle")}
        />

        {/* FAQ accordion — same visual as servicos/[slug] FAQ block */}
        <section className="relative mx-auto w-full max-w-content px-8 py-16 md:py-24">
          <div className="max-w-[900px] mx-auto flex flex-col gap-4">
            {items.map((faq) => (
              <Reveal key={faq.q}>
                <details
                  className={cn(
                    "group rounded-[18px] border border-dune-deep/10",
                    "bg-sand-warm/60 backdrop-blur",
                    "px-7 py-6 transition-colors",
                    "open:bg-ink open:text-cream open:border-ink",
                  )}
                >
                  <summary
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-4",
                      "list-none font-display text-[18px] md:text-[19px] font-semibold",
                      "[&::-webkit-details-marker]:hidden",
                    )}
                  >
                    {faq.q}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "text-[28px] leading-none text-ember",
                        "transition-transform duration-300",
                        "group-open:rotate-45 group-open:text-apricot",
                      )}
                    >
                      +
                    </span>
                  </summary>
                  <p
                    className={cn(
                      "mt-4 text-[15px] leading-[1.65]",
                      "text-ink-soft group-open:text-cream-deep",
                    )}
                  >
                    {faq.a}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <ClosingCTA
          title={t("closingTitle")}
          body={t("closingBody")}
          ctaLabel={t("ctaContact")}
          ctaHref="/contacto?from=home"
        />
      </main>
      <Footer />
    </div>
  );
}
