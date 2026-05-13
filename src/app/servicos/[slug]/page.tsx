import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageHero } from "@/components/sections/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";
import { publicEnv } from "@/lib/env";
import { waLink } from "@/lib/whatsapp";
import {
  SERVICOS_SLUGS,
  getServicoContent,
  isServicoSlug,
  type ServicoSlug,
  type ServiceContent,
} from "@/lib/servicos-content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return SERVICOS_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isServicoSlug(slug)) return {};

  const locale = await getLocale();
  const content = await getServicoContent(locale, slug);
  const base = publicEnv.baseUrl;

  // Strip <em>...</em> from title for plain-text metadata.
  const plainTitle = content.title.replace(/<\/?em>/g, "");
  const fullTitle = `${plainTitle} — RedDune Solutions`;

  return {
    title: fullTitle,
    description: content.lead,
    alternates: {
      canonical: `${base}/servicos/${slug}`,
      languages: {
        pt: `${base}/servicos/${slug}`,
        en: `${base}/servicos/${slug}`,
      },
    },
    openGraph: {
      title: fullTitle,
      description: content.lead,
      type: "website",
      locale,
      url: `${base}/servicos/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: content.lead,
    },
  };
}

// Tiny HTML interpreter for the limited set of tags we use in content JSON:
// <em>, <b>. Anything else is rendered as text.
function renderRich(html: string): React.ReactNode {
  const regex = /<(\/?)(em|b)>/g;
  const segments: Array<{ tag?: "em" | "b"; text: string }> = [];
  let cursor = 0;
  let currentTag: "em" | "b" | undefined = undefined;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const isClose = match[1] === "/";
    const tag = match[2] as "em" | "b";
    const before = html.slice(cursor, match.index);
    if (before) {
      segments.push({ tag: currentTag, text: before });
    }
    if (!isClose) {
      currentTag = tag;
    } else if (currentTag === tag) {
      currentTag = undefined;
    }
    cursor = regex.lastIndex;
  }
  const tail = html.slice(cursor);
  if (tail) segments.push({ tag: currentTag, text: tail });

  return segments.map((seg, i) => {
    if (seg.tag === "em") return <em key={i}>{seg.text}</em>;
    if (seg.tag === "b") return <b key={i}>{seg.text}</b>;
    return <span key={i}>{seg.text}</span>;
  });
}

// Visuals (radial blob) for each item card — port of the .svc .visual SVGs.
function ItemVisual({ index }: { index: number }) {
  const gradId = `svc-item-grad-${index}`;
  return (
    <svg
      viewBox="0 0 300 225"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    >
      <defs>
        <radialGradient id={gradId}>
          <stop offset="0" stopColor="#ff8a5c" />
          <stop offset="1" stopColor="#5a0e0e" />
        </radialGradient>
      </defs>
      <circle
        className="icon-blob"
        cx={80 + ((index * 50) % 250)}
        cy={100 + ((index % 2) * 30)}
        r={50 + (index % 4) * 5}
        fill={`url(#${gradId})`}
        opacity="0.8"
      />
    </svg>
  );
}

function WhatsappLink({
  message,
  children,
  className,
}: {
  message: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={waLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}

function ServicoCTA({ content }: { content: ServiceContent }) {
  return (
    <section
      id="contacto"
      className="px-8 my-20 mb-[60px] mx-auto w-full max-w-content"
    >
      <Reveal>
        <div
          className={cn(
            "relative overflow-hidden rounded-[40px]",
            "px-[60px] py-[100px]",
            "text-center text-cream",
          )}
          style={{
            background:
              "linear-gradient(160deg, #d6422a 0%, #a8201a 50%, #5a0e0e 100%)",
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-[200px] left-1/2 -translate-x-1/2 h-[800px] w-[800px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,107,63,0.5), transparent 60%)",
              animation: "ctapulse 4s ease-in-out infinite",
            }}
          />
          <svg
            aria-hidden="true"
            viewBox="0 0 1920 200"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-0 w-full opacity-35"
          >
            <path
              d="M 0 100 C 320 60, 640 140, 960 100 C 1280 60, 1600 140, 1920 100 L 1920 200 L 0 200 Z"
              fill="#fff7e8"
            />
          </svg>
          <div className="relative z-[1] mx-auto max-w-[900px]">
            <h2
              className={cn(
                "font-display font-bold mb-7",
                "text-[clamp(40px,6vw,96px)] leading-[0.98] tracking-[-0.035em]",
                "[&_em]:font-serif [&_em]:italic [&_em]:font-medium [&_em]:text-apricot",
              )}
            >
              {renderRich(content.cta.title)}
            </h2>
            <p
              className={cn(
                "mx-auto max-w-[600px] mb-10",
                "text-[17px] md:text-[19px] leading-[1.55] text-cream-deep",
              )}
            >
              {content.cta.lead}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-[14px]">
              <WhatsappLink
                message={content.cta.primaryMessage}
                className={cn(
                  "group inline-flex items-center gap-3",
                  "rounded-btn bg-cream px-8 py-5",
                  "text-[15px] font-semibold text-ink",
                  "transition-all duration-300",
                  "hover:bg-apricot hover:scale-[1.04]",
                )}
              >
                {content.cta.primary}
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform duration-300 group-hover:rotate-[-45deg]"
                >
                  →
                </span>
              </WhatsappLink>
              <Link
                href="/servicos"
                className={cn(
                  "inline-flex items-center",
                  "rounded-btn border border-cream/40 bg-transparent",
                  "px-[30px] py-5",
                  "text-[15px] font-medium text-cream",
                  "transition-all duration-300",
                  "hover:bg-cream/10 hover:border-cream",
                )}
              >
                {content.cta.secondary}
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function ServicoStatsRow({ stats }: { stats: ServiceContent["stats"] }) {
  if (stats.length === 0) return null;

  return (
    <section className="relative mx-auto w-full max-w-content px-8 py-[80px]">
      <Reveal>
        <div
          className={cn(
            "relative grid gap-8 overflow-hidden",
            "grid-cols-2",
            stats.length === 3 ? "md:grid-cols-3" : "md:grid-cols-4",
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
          {stats.map((stat) => (
            <div key={stat.label} className="relative z-[1]">
              <div
                className={cn(
                  "font-display font-bold tracking-[-0.03em]",
                  "text-[clamp(40px,5vw,68px)] leading-[0.95]",
                  "bg-clip-text text-transparent",
                )}
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--cream) 0%, var(--apricot) 70%, var(--ember) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {stat.value}
              </div>
              <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-apricot">
                {stat.label}
              </div>
              {stat.sub && (
                <div className="mt-2 text-sm font-medium text-cream-deep">
                  {stat.sub}
                </div>
              )}
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

export default async function ServicoSlugPage({ params }: PageProps) {
  const { slug } = await params;
  if (!isServicoSlug(slug)) {
    notFound();
  }
  const typedSlug: ServicoSlug = slug;

  const locale = await getLocale();
  const content = await getServicoContent(locale, typedSlug);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main id="main" className="flex-grow">
        <PageHero
          eyebrow={content.eyebrow}
          title={renderRich(content.title)}
          description={content.lead}
        />

        {/* Overview block */}
        <section className="relative mx-auto w-full max-w-content px-8 pt-16 md:pt-20 pb-8">
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
              {content.overview.eyebrow}
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
              {renderRich(content.overview.title)}
            </h2>
          </Reveal>
          <Reveal>
            <p className="max-w-[760px] text-[17px] md:text-[19px] leading-[1.6] text-ink-soft">
              {content.overview.lead}
            </p>
          </Reveal>
        </section>

        {/* Items block */}
        <section className="relative mx-auto w-full max-w-content px-8 py-16">
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
              {content.items.eyebrow}
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
              {renderRich(content.items.title)}
            </h2>
          </Reveal>
          <Reveal>
            <p className="max-w-[760px] mb-[50px] text-[17px] leading-[1.55] text-ink-soft">
              {content.items.lead}
            </p>
          </Reveal>

          <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {content.items.list.map((item, index) => (
              <Reveal key={item.title}>
                <article
                  className={cn(
                    "flex h-full min-h-[420px] flex-col overflow-hidden",
                    "rounded-card bg-sand-warm",
                    "px-8 pt-9 pb-8",
                    "shadow-warm",
                  )}
                >
                  <div
                    className={cn(
                      "relative mb-6 overflow-hidden rounded-[20px] aspect-[4/3]",
                    )}
                    style={{
                      background:
                        "linear-gradient(135deg, var(--cream-deep), var(--peach))",
                    }}
                  >
                    <ItemVisual index={index} />
                  </div>

                  <h3
                    className={cn(
                      "font-display font-bold text-[22px] leading-[1.1] tracking-[-0.02em] mb-3",
                      "text-ink",
                    )}
                  >
                    {item.title}
                  </h3>
                  <p className="flex-1 text-[14px] leading-[1.55] text-ink-soft">
                    {item.description}
                  </p>

                  <div className="mt-5 pt-5 border-t border-dashed border-dune-deep/15">
                    <span
                      className={cn(
                        "font-mono text-[12px] uppercase tracking-[0.12em] text-ink-soft",
                        "[&_b]:font-display [&_b]:font-bold [&_b]:not-italic [&_b]:text-ember [&_b]:text-[15px]",
                      )}
                    >
                      {renderRich(item.price)}
                    </span>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          {/* Note row */}
          <Reveal>
            <div
              className={cn(
                "mt-10 grid items-center gap-6",
                "grid-cols-1 md:grid-cols-[1fr_auto]",
                "rounded-card bg-ink text-cream",
                "px-8 py-7",
              )}
            >
              <p
                className={cn(
                  "text-[15px] md:text-[16px] leading-[1.6]",
                  "[&_em]:font-serif [&_em]:italic [&_em]:font-medium [&_em]:text-apricot",
                  "[&_b]:text-apricot [&_b]:font-semibold",
                )}
              >
                {renderRich(content.items.note)}
              </p>
              <WhatsappLink
                message={content.items.noteCtaMessage}
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap gap-2",
                  "rounded-btn bg-cream text-ink",
                  "px-[22px] py-[14px] text-[14px] font-semibold",
                  "transition-colors duration-300 hover:bg-apricot",
                )}
              >
                {content.items.noteCta}
                <span aria-hidden="true">→</span>
              </WhatsappLink>
            </div>
          </Reveal>
        </section>

        {/* Stats row */}
        <ServicoStatsRow stats={content.stats} />

        {/* FAQ block */}
        <section className="relative mx-auto w-full max-w-content px-8 py-16">
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
              {content.faqs.eyebrow}
            </span>
          </Reveal>
          <Reveal>
            <h2
              className={cn(
                "font-display font-bold text-ink max-w-[1000px] mb-12",
                "text-[clamp(32px,4.8vw,68px)] leading-[1.05] tracking-[-0.03em]",
                "[&_em]:font-serif [&_em]:italic [&_em]:font-medium [&_em]:text-ember",
              )}
            >
              {renderRich(content.faqs.title)}
            </h2>
          </Reveal>

          <div className="max-w-[900px] mx-auto flex flex-col gap-4">
            {content.faqs.list.map((faq) => (
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

        <ServicoCTA content={content} />
      </main>
      <Footer />
    </div>
  );
}
