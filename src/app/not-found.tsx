import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

// 404 global — substitui a página default do Next (inglês, sem navegação).
// Copy estática em PT: o locale vem de cookie e não está garantido no
// prerender da página de erro; PT é o público-alvo.
export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main id="main" className="flex-grow flex items-center">
        <section className="mx-auto w-full max-w-content px-8 py-24 md:py-32">
          <span
            className={cn(
              "inline-flex items-center gap-[10px]",
              "rounded-btn border border-ember/20 bg-ember/[0.08]",
              "px-[14px] py-[6px] mb-7",
              "font-mono text-[11px] uppercase tracking-[0.2em] text-ember",
            )}
          >
            <span aria-hidden="true" className="block h-1.5 w-1.5 rounded-sm bg-ember" />
            Erro 404
          </span>
          <h1
            className={cn(
              "font-display font-bold text-ink max-w-[900px] mb-6",
              "text-[clamp(36px,5vw,72px)] leading-none tracking-[-0.035em]",
              "[&_em]:font-serif [&_em]:italic [&_em]:font-medium [&_em]:text-ember",
            )}
          >
            Esta página <em>perdeu-se</em> nas dunas.
          </h1>
          <p className="max-w-[640px] text-[17px] md:text-[19px] leading-[1.55] text-ink-soft mb-10">
            O endereço que procuras não existe ou mudou de sítio. Volta ao
            início ou espreita os nossos serviços — a resposta certa está a um
            clique.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/"
              className={cn(
                "inline-flex items-center gap-2",
                "rounded-btn bg-ember text-cream",
                "px-[22px] py-[14px] text-[14px] font-semibold",
                "transition-colors duration-300 hover:bg-dune",
              )}
            >
              Voltar ao início
              <ArrowRight className="size-[15px] shrink-0" strokeWidth={2.25} aria-hidden />
            </Link>
            <Link
              href="/servicos"
              className={cn(
                "inline-flex items-center gap-2",
                "rounded-btn border border-ember/25 bg-transparent text-ink",
                "px-[22px] py-[14px] text-[14px] font-semibold",
                "transition-colors duration-300 hover:bg-ember/[0.08]",
              )}
            >
              Ver serviços
            </Link>
            <Link
              href="/loja"
              className={cn(
                "inline-flex items-center gap-2",
                "rounded-btn border border-ember/25 bg-transparent text-ink",
                "px-[22px] py-[14px] text-[14px] font-semibold",
                "transition-colors duration-300 hover:bg-ember/[0.08]",
              )}
            >
              Ir à loja
            </Link>
            <Link
              href="/contacto"
              className={cn(
                "inline-flex items-center gap-2",
                "rounded-btn border border-ember/25 bg-transparent text-ink",
                "px-[22px] py-[14px] text-[14px] font-semibold",
                "transition-colors duration-300 hover:bg-ember/[0.08]",
              )}
            >
              Falar connosco
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
