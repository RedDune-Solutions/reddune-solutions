import type { ServicoSlug } from "@/types/servico";

export type PortfolioCategoria = ServicoSlug;

export const PORTFOLIO_CATEGORIA_LABEL: Record<PortfolioCategoria, string> = {
  "assistencia-tecnica": "Assistência Técnica",
  "web-digital": "Web / Digital",
  "software-recuperacao": "Software / Recuperação",
};

export type PortfolioItem = {
  id: string;
  title: { pt: string; en: string };
  imageUrl: string;
  url: string;
  categoria: PortfolioCategoria | null;
  destaqueLanding: boolean;
  createdAt?: string;
};
