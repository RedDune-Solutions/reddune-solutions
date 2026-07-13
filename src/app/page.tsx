import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { Services } from "@/components/sections/Services";
import { BigMark } from "@/components/sections/BigMark";
import { Portfolio } from "@/components/sections/Portfolio";
import { StatsRow } from "@/components/sections/StatsRow";
import { About } from "@/components/sections/About";
import { CTAWave } from "@/components/sections/CTAWave";
import { getDestaquesLanding, getAllPortfolioItems } from "@/lib/mongodb/portfolio";
import { getLocale } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isPt = locale !== "en";

  // Keyword de serviço + localização no <title>; o slogan da marca vive no
  // H1 visível do hero, não aqui.
  return buildMetadata({
    title: isPt
      ? "Assistência Informática e Web em Fuseta | RedDune Solutions"
      : "IT Support & Web Services in Fuseta, Algarve | RedDune",
    description: isPt
      ? "Assistência técnica informática, montagem de PCs, websites e recuperação de dados em Fuseta e em todo o Algarve. Serviço próximo, para pessoas e empresas."
      : "Computer repair, custom PC builds, web development and data recovery in Fuseta and across the Algarve. Personal IT service for homes and businesses.",
    keywords: isPt
      ? ["assistência técnica informática", "reparação computadores", "Fuseta", "Algarve", "serviços web", "recuperação de dados", "RedDune Solutions", "montagem PC"]
      : ["computer repair", "IT support", "Fuseta", "Algarve", "web services", "data recovery", "RedDune Solutions", "PC assembly"],
    path: "/",
    locale,
  });
}

export default async function Home() {
  // Landing mostra apenas destaques marcados na dashboard (1 por categoria).
  // Fallback para os 3 mais recentes se ainda não houver destaques marcados.
  const destaques = await getDestaquesLanding();
  const portfolioItems =
    destaques.length > 0 ? destaques : (await getAllPortfolioItems()).slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main id="main" className="flex-grow">
        <Hero />
        <TrustStrip />
        <Services />
        <BigMark />
        <Portfolio items={portfolioItems} />
        <StatsRow />
        <About />
        <CTAWave />
      </main>
      <Footer />
    </div>
  );
}
