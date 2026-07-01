import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

/**
 * ClosingCTA — Oasis v5 closing CTA para páginas internas (políticas, FAQ, loja).
 *
 * Substitui o antigo card plano `bg-sand-warm/70 ... text-center` (sem piada):
 * mais quente e vivo, mas mais leve que o slab ember da home (CTAWave).
 * Detalhe-assinatura: anéis concêntricos "dune sun" + halo radial ember por
 * trás do título (eco do halo do CTAWave) sobre gradiente sand→apricot.
 *
 * TYPE: display bold + serif itálico no acento (default do site)
 * COLOR: base sand-warm/cream/apricot, glow ember, texto ink
 * LAYOUT: arejado/centrado, quebrado pelo halo + anéis assimétricos
 * ACCENT_MOTIF: "dune sun" (anéis concêntricos + halo radial ember)
 * INTERACTION: contido/warm — CTA ember + seta roda -45°, card lift no hover
 *
 * `title` aceita rich text: envolve uma palavra em <em> para o acento serif.
 */
type Props = {
  title: React.ReactNode;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  /** Rótulo mono por cima do título. Default: chave i18n ClosingCta.eyebrow. */
  eyebrow?: string;
};

export function ClosingCTA({ title, body, ctaLabel, ctaHref, eyebrow }: Props) {
  const t = useTranslations("ClosingCta");
  const label = eyebrow ?? t("eyebrow");

  return (
    <section className="mx-auto my-20 w-full max-w-content px-8">
      <Reveal>
        <div
          className={cn(
            "group/cta relative overflow-hidden rounded-[32px]",
            "border border-ember/15",
            "px-8 py-14 md:px-14 md:py-16",
            "text-center",
            "shadow-[0_24px_70px_-30px_rgba(214,66,42,0.30)]",
            "transition-shadow duration-500 hover:shadow-[0_30px_84px_-28px_rgba(214,66,42,0.44)]",
          )}
          style={{
            background:
              "linear-gradient(150deg, #faf4e3 0%, #f7eedb 55%, #f4dcc6 100%)",
          }}
        >
          {/* Halo radial ember (estático, subtil) */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-[220px] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(214,66,42,0.18), transparent 62%)",
            }}
          />
          {/* Assinatura: anéis concêntricos dune-sun */}
          <svg
            aria-hidden
            viewBox="0 0 400 400"
            className="pointer-events-none absolute -top-[150px] left-1/2 h-[420px] w-[420px] -translate-x-1/2"
          >
            {[70, 120, 170, 220].map((r) => (
              <circle
                key={r}
                cx="200"
                cy="200"
                r={r}
                fill="none"
                stroke="#d6422a"
                strokeOpacity={0.13}
                strokeWidth={1.25}
              />
            ))}
          </svg>

          <div className="relative z-[1] mx-auto max-w-[620px]">
            {label ? (
              <span className="mb-4 inline-block font-mono text-[11px] uppercase tracking-[0.2em] text-ember">
                {label}
              </span>
            ) : null}
            <h2
              className={cn(
                "font-display font-bold text-ink",
                "mb-5 text-[clamp(28px,3.6vw,46px)] leading-[1.08] tracking-[-0.02em]",
                "[&_em]:font-serif [&_em]:italic [&_em]:font-medium [&_em]:text-ember",
              )}
            >
              {title}
            </h2>
            <p className="mx-auto mb-9 max-w-[560px] text-[16px] leading-[1.65] text-ink-soft">
              {body}
            </p>
            <Link
              href={ctaHref}
              className={cn(
                "group/btn inline-flex items-center gap-3",
                "rounded-btn bg-ink px-7 py-4",
                "text-[14px] font-semibold text-cream",
                "transition-all duration-300",
                "hover:bg-ember hover:scale-[1.04]",
              )}
            >
              {ctaLabel}
              <span
                aria-hidden
                className="inline-block transition-transform duration-300 group-hover/btn:rotate-[-45deg]"
              >
                <ArrowRight className="size-[15px] shrink-0" strokeWidth={2.25} />
              </span>
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
