import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageHero } from "@/components/sections/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { ClosingCTA } from "@/components/sections/ClosingCTA";
import { getLocale, getTranslations } from "next-intl/server";
import { publicEnv } from "@/lib/env";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const base = publicEnv.baseUrl;
  const t = await getTranslations("WarrantyPolicyPage");

  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: {
      canonical: `${base}/loja/politica-garantia`,
      languages: {
        pt: `${base}/loja/politica-garantia`,
        en: `${base}/loja/politica-garantia`,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale,
      url: `${base}/loja/politica-garantia`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function WarrantyPolicyPage() {
  const t = await getTranslations("WarrantyPolicyPage");

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main id="main" className="flex-grow">
        <PageHero
          eyebrow="Loja · políticas"
          title={
            <>
              {t("title").split(/\s(?=[^\s]+$)/).map((part, i, arr) =>
                i === arr.length - 1 ? (
                  <em key={i}>{part}</em>
                ) : (
                  <span key={i}>{part} </span>
                ),
              )}
            </>
          }
          description={t("subtitle")}
        />

        {/* Intro stats — visual hook */}
        <section className="relative mx-auto w-full max-w-content px-8 pt-12 md:pt-16 pb-8">
          <Reveal>
            <p
              className={cn(
                "max-w-[760px] text-[17px] md:text-[19px] leading-[1.65] text-ink-soft mb-12",
              )}
            >
              {t("intro")}
            </p>
          </Reveal>

          <Reveal>
            <div
              className={cn(
                "relative grid gap-8 overflow-hidden",
                "grid-cols-1 md:grid-cols-2",
                "rounded-card bg-ink text-cream",
                "px-10 py-[60px]",
              )}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 -right-36 z-0 h-[500px] w-[500px] rounded-full opacity-40"
                style={{
                  background:
                    "radial-gradient(circle, var(--ember), transparent 60%)",
                  animation: "glow 5s ease-in-out infinite",
                }}
              />
              {[
                {
                  label: t("newLabel"),
                  duration: t("newDuration"),
                  caption: t("newCaption"),
                },
                {
                  label: t("refurbishedLabel"),
                  duration: t("refurbishedDuration"),
                  caption: t("refurbishedCaption"),
                },
              ].map((cell, i) => (
                <div key={`${cell.label}-${i}`} className="relative z-[1]">
                  <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-apricot mb-3">
                    {cell.label}
                  </div>
                  <div
                    className={cn(
                      "font-display font-bold tracking-[-0.03em]",
                      "text-[clamp(48px,6vw,88px)] leading-[0.95]",
                      "bg-clip-text text-transparent",
                    )}
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, var(--cream) 0%, var(--apricot) 70%, var(--ember) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {cell.duration}
                  </div>
                  <div className="mt-2 text-sm text-cream-deep">
                    {cell.caption}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Closing CTA */}
        <ClosingCTA
          title={t("closingTitle")}
          body={t("closingBody")}
          ctaLabel={t("ctaContact")}
          ctaHref="/contacto?from=shop"
        />
      </main>
      <Footer />
    </div>
  );
}
