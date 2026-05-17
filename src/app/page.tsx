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
import { publicEnv } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const base = publicEnv.baseUrl;
  const isPt = locale !== "en";

  const title = isPt
    ? "RedDune Solutions - A resposta certa, para qualquer problema."
    : "RedDune Solutions - The right answer, for any problem.";
  const description = isPt
    ? "Assistência técnica informática, montagem de PCs, desenvolvimento web e recuperação de dados em Fuseta, Algarve. Serviço personalizado para particulares e empresas."
    : "Computer repair, PC assembly, web development and data recovery in Fuseta, Algarve. Personalised IT service for individuals and businesses.";

  return {
    title,
    description,
    keywords: isPt
      ? ["assistência técnica informática", "reparação computadores", "Fuseta", "Algarve", "serviços web", "recuperação de dados", "RedDune Solutions", "montagem PC"]
      : ["computer repair", "IT support", "Fuseta", "Algarve", "web services", "data recovery", "RedDune Solutions", "PC assembly"],
    alternates: {
      canonical: `${base}/`,
      languages: { pt: `${base}/`, en: `${base}/` },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale,
      url: `${base}/`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
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
