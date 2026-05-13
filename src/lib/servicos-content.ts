/**
 * servicos-content — loader for per-locale per-slug service JSON.
 *
 * Reads `content/{locale}/servicos/{slug}.json` synchronously at request time
 * (Node fs). Designed for static generation (`generateStaticParams`).
 */

import { promises as fs } from "node:fs";
import path from "node:path";

export type ServiceListItem = {
  title: string;
  description: string;
  price: string;
};

export type ServiceStat = {
  value: string;
  label: string;
  sub?: string;
};

export type ServiceFaq = {
  q: string;
  a: string;
};

export type ServiceContent = {
  slug: string;
  eyebrow: string;
  title: string;
  lead: string;
  overview: {
    eyebrow: string;
    title: string;
    lead: string;
  };
  items: {
    eyebrow: string;
    title: string;
    lead: string;
    list: ServiceListItem[];
    note: string;
    noteCta: string;
    noteCtaMessage: string;
  };
  stats: ServiceStat[];
  faqs: {
    eyebrow: string;
    title: string;
    list: ServiceFaq[];
  };
  cta: {
    title: string;
    lead: string;
    primary: string;
    primaryMessage: string;
    secondary: string;
  };
};

export const SERVICOS_SLUGS = [
  "assistencia-tecnica",
  "web-digital",
  "software-recuperacao",
] as const;

export type ServicoSlug = (typeof SERVICOS_SLUGS)[number];

export function isServicoSlug(slug: string): slug is ServicoSlug {
  return (SERVICOS_SLUGS as readonly string[]).includes(slug);
}

export async function getServicoContent(
  locale: string,
  slug: ServicoSlug,
): Promise<ServiceContent> {
  const safeLocale = locale === "en" ? "en" : "pt";
  const file = path.join(
    process.cwd(),
    "content",
    safeLocale,
    "servicos",
    `${slug}.json`,
  );
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw) as ServiceContent;
}
