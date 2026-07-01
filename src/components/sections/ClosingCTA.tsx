import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

/**
 * ClosingCTA — closing CTA das páginas internas (políticas, FAQ).
 *
 * Coerente com o CTAWave da home: slab de gradiente ember -> dune-deep,
 * texto cream, halo radial pulsante (`ctapulse`) e onda decorativa em baixo.
 * Escala reduzida vs home (é CTA secundário) e um único botão primário
 * (cream -> apricot). Reutiliza os keyframes globais `ctapulse`.
 *
 * `title` aceita rich text: envolve uma palavra em <em> para o acento
 * serif itálico apricot (igual ao CTAWave).
 */
type Props = {
  title: React.ReactNode;
  body: string;
  ctaLabel: string;
  ctaHref: string;
};

export function ClosingCTA({ title, body, ctaLabel, ctaHref }: Props) {
  return (
    <section className="mx-auto my-20 w-full max-w-content px-8">
      <Reveal>
        <div
          className={cn(
            "relative overflow-hidden rounded-[40px]",
            "px-8 py-[72px] md:px-[60px] md:py-[84px]",
            "text-center text-cream",
          )}
          style={{
            background:
              "linear-gradient(160deg, #d6422a 0%, #a8201a 50%, #5a0e0e 100%)",
          }}
        >
          {/* Halo radial pulsante — igual ao CTAWave */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-[200px] left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,107,63,0.5), transparent 60%)",
              animation: "ctapulse 4s ease-in-out infinite",
            }}
          />
          {/* Onda decorativa em baixo — igual ao CTAWave */}
          <svg
            aria-hidden
            viewBox="0 0 1920 200"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-0 w-full opacity-35"
          >
            <path
              d="M 0 100 C 320 60, 640 140, 960 100 C 1280 60, 1600 140, 1920 100 L 1920 200 L 0 200 Z"
              fill="#fff7e8"
            />
          </svg>

          {/* Conteúdo */}
          <div className="relative z-[1] mx-auto max-w-[720px]">
            <h2
              className={cn(
                "font-display font-bold mb-5",
                "text-[clamp(32px,5vw,60px)] leading-[1.02] tracking-[-0.03em]",
                "[&_em]:font-serif [&_em]:italic [&_em]:font-medium [&_em]:text-apricot",
              )}
            >
              {title}
            </h2>
            <p className="mx-auto mb-9 max-w-[560px] text-[17px] leading-[1.55] text-cream-deep">
              {body}
            </p>
            <Link
              href={ctaHref}
              className={cn(
                "group/btn inline-flex items-center gap-3",
                "rounded-btn bg-cream px-8 py-5",
                "text-[15px] font-semibold text-ink",
                "transition-all duration-300",
                "hover:bg-apricot hover:scale-[1.04]",
              )}
            >
              {ctaLabel}
              <span
                aria-hidden
                className="inline-block transition-transform duration-300 group-hover/btn:rotate-[-45deg]"
              >
                <ArrowRight className="size-[18px]" strokeWidth={2.25} />
              </span>
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
