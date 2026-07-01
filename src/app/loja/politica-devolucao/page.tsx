import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageHero } from "@/components/sections/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { ClosingCTA } from "@/components/sections/ClosingCTA";
import { getLocale, getTranslations } from "next-intl/server";
import { publicEnv } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const base = publicEnv.baseUrl;
  const t = await getTranslations("ReturnPolicyPage");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `${base}/loja/politica-devolucao`,
      languages: {
        pt: `${base}/loja/politica-devolucao`,
        en: `${base}/loja/politica-devolucao`,
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
      locale,
      url: `${base}/loja/politica-devolucao`,
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
  };
}

type PolicySection = {
  n: string;
  title: string;
  body: string;
};

// Very small inline HTML interpreter for <strong> tags used in policy body.
function renderPolicyBody(html: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /<(\/?)(strong)>/g;
  let cursor = 0;
  let inStrong = false;
  let match: RegExpExecArray | null;
  const segments: Array<{ strong: boolean; text: string }> = [];

  while ((match = regex.exec(html)) !== null) {
    const isClose = match[1] === "/";
    const before = html.slice(cursor, match.index);
    if (before) segments.push({ strong: inStrong, text: before });
    inStrong = !isClose;
    cursor = regex.lastIndex;
  }
  const tail = html.slice(cursor);
  if (tail) segments.push({ strong: inStrong, text: tail });

  return segments.map((seg, i) =>
    seg.strong ? (
      <strong key={i} className="font-semibold text-ink">
        {seg.text}
      </strong>
    ) : (
      <span key={i}>{seg.text}</span>
    ),
  );
}

export default async function ReturnPolicyPage() {
  const t = await getTranslations("ReturnPolicyPage");
  const sectionsRaw = t.raw("sections");
  const sections = Array.isArray(sectionsRaw)
    ? (sectionsRaw as PolicySection[])
    : [];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main id="main" className="flex-grow">
        <PageHero
          eyebrow={t("eyebrow")}
          title={t.rich("title", {
            em: (chunks) => <em>{chunks}</em>,
          })}
          description={t("subtitle")}
        />

        <section className="relative mx-auto w-full max-w-content px-8 py-16 md:py-24">
          <div className="mx-auto max-w-[820px] flex flex-col gap-10">
            {sections.map((sec) => (
              <Reveal key={sec.n}>
                <article>
                  <div className="flex items-baseline gap-4 mb-4">
                    <span className="font-mono text-[13px] uppercase tracking-[0.12em] text-ember">
                      {sec.n}
                    </span>
                    <h3 className="font-display text-[24px] md:text-[28px] font-bold tracking-[-0.01em] text-ink m-0">
                      {sec.title}
                    </h3>
                  </div>
                  <p className="text-[16px] leading-[1.7] text-ink-soft">
                    {renderPolicyBody(sec.body)}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

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
