import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageHero } from "@/components/sections/PageHero";
import { PortfolioGrid } from "@/components/sections/PortfolioGrid";
import { CTAWave } from "@/components/sections/CTAWave";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";
import { getAllPortfolioItems } from "@/lib/mongodb/portfolio";
import { publicEnv } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const base = publicEnv.baseUrl;
  const t = await getTranslations("PortfolioPage.meta");

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${base}/portfolio`,
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      locale,
      url: `${base}/portfolio`,
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

function PortfolioHero() {
  const t = useTranslations("PortfolioPage.hero");
  return (
    <PageHero
      eyebrow={t("eyebrow")}
      title={t.rich("title", {
        accent: (chunks) => <em>{chunks}</em>,
      })}
      description={t("lead")}
    />
  );
}

function PortfolioIntro() {
  const t = useTranslations("PortfolioPage.intro");
  return (
    <section className="relative mx-auto w-full max-w-content px-8 pt-16 md:pt-24 pb-8">
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
          {t("eyebrow")}
        </span>
      </Reveal>
      <Reveal>
        <h2
          className={cn(
            "font-display font-bold text-ink max-w-[1000px] mb-6",
            "text-[clamp(36px,5vw,76px)] leading-none tracking-[-0.035em]",
            "[&_em]:font-serif [&_em]:italic [&_em]:font-medium [&_em]:text-ember",
          )}
          style={{ fontVariationSettings: '"opsz" 76' }}
        >
          {t.rich("title", {
            accent: (chunks) => <em>{chunks}</em>,
          })}
        </h2>
      </Reveal>
      <Reveal>
        <p className="max-w-[760px] text-[17px] md:text-[19px] leading-[1.55] text-ink-soft">
          {t("lead")}
        </p>
      </Reveal>
    </section>
  );
}

function InstagramNote() {
  const t = useTranslations("PortfolioPage");
  return (
    <section className="mx-auto w-full max-w-content px-8 py-12">
      <Reveal>
        <div
          className={cn(
            "grid items-center gap-6",
            "grid-cols-1 md:grid-cols-[1fr_auto]",
            "rounded-card bg-ink text-cream",
            "px-8 py-7",
          )}
        >
          <p
            className={cn(
              "text-[16px] md:text-[17px] leading-[1.55]",
              "[&_em]:font-serif [&_em]:italic [&_em]:font-medium [&_em]:text-apricot",
            )}
          >
            {t.rich("instagramNote", {
              em: (chunks) => <em>{chunks}</em>,
            })}
          </p>
          <a
            href="https://www.instagram.com/reddune_solutions/"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap gap-2",
              "rounded-btn bg-cream text-ink",
              "px-[22px] py-[14px] text-[14px] font-semibold",
              "transition-colors duration-300 hover:bg-apricot",
            )}
          >
            {t("instagramCta")}
            <ArrowRight
              className="size-[15px] shrink-0"
              strokeWidth={2.25}
              aria-hidden
            />
          </a>
        </div>
      </Reveal>
    </section>
  );
}

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const [items, sp] = await Promise.all([getAllPortfolioItems(), searchParams]);
  const initialFilter = sp.categoria ?? "all";

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main id="main" className="flex-grow">
        <PortfolioHero />
        <PortfolioIntro />
        <section className="py-12 md:py-16">
          <PortfolioGrid items={items} initialFilter={initialFilter} />
        </section>
        <InstagramNote />
        <CTAWave />
      </main>
      <Footer />
    </div>
  );
}
