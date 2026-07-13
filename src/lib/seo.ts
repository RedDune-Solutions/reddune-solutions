/**
 * seo — helpers de metadata partilhados entre páginas.
 */

import type { Metadata } from "next";
import { publicEnv } from "@/lib/env";

/**
 * Converte o locale do next-intl ("pt"/"en") no formato Open Graph
 * `ll_CC` (og:locale exige território, ex.: pt_PT).
 */
export function ogLocale(locale: string): string {
  return locale === "en" ? "en_GB" : "pt_PT";
}

const OG_IMAGE_ALT = "RedDune Solutions — A resposta certa.";

type BuildMetadataParams = {
  title: string;
  description: string;
  /** Caminho da página começado por "/" ("" ou "/" para a home). */
  path: string;
  /** Locale do next-intl ("pt" | "en"). */
  locale: string;
  keywords?: string[];
};

/**
 * buildMetadata — metadata completa e consistente para páginas públicas.
 *
 * O merge de metadata do Next é RASO: um `openGraph` definido na página
 * substitui o do layout inteiro (perde-se siteName e a imagem). Este helper
 * garante canonical, OG completo (imagem + site_name + locale ll_CC) e
 * twitter card em todas as páginas sem repetição.
 */
export function buildMetadata(p: BuildMetadataParams): Metadata {
  const base = publicEnv.baseUrl;
  const url = p.path && p.path !== "/" ? `${base}${p.path}` : base;
  const ogImage = `${base}/opengraph-image`;

  return {
    title: p.title,
    description: p.description,
    ...(p.keywords && { keywords: p.keywords }),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: p.title,
      description: p.description,
      siteName: "RedDune Solutions",
      type: "website",
      locale: ogLocale(p.locale),
      url,
      images: [{ url: ogImage, width: 1200, height: 630, alt: OG_IMAGE_ALT }],
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description: p.description,
      images: [ogImage],
    },
  };
}
