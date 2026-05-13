import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

const routes: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/servicos", changeFrequency: "monthly", priority: 0.8 },
  { path: "/servicos/assistencia-tecnica", changeFrequency: "monthly", priority: 0.7 },
  { path: "/servicos/web-digital", changeFrequency: "monthly", priority: 0.7 },
  { path: "/servicos/software-recuperacao", changeFrequency: "monthly", priority: 0.7 },
  { path: "/portfolio", changeFrequency: "monthly", priority: 0.7 },
  { path: "/loja", changeFrequency: "daily", priority: 0.9 },
  { path: "/loja/politica-garantia", changeFrequency: "yearly", priority: 0.4 },
  { path: "/loja/politica-devolucao", changeFrequency: "yearly", priority: 0.4 },
  { path: "/contacto", changeFrequency: "yearly", priority: 0.6 },
  { path: "/politica-privacidade", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicEnv.baseUrl;
  const lastModified = new Date();

  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
