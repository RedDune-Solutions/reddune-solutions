import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // /api/brief tem de estar Allow apesar do Disallow /api/: o fetcher do
      // Resumo Matinal (tarefa agendada) respeita robots.txt e recusava o
      // endpoint. Allow mais específico ganha ao Disallow (longest match).
      // Sem risco de indexação: a rota exige token e devolve 401 sem ele.
      allow: ["/", "/api/brief"],
      disallow: ["/api/", "/painel", "/painel/", "/entrar", "/entrar/", "/p/"],
    },
    sitemap: `${publicEnv.baseUrl}/sitemap.xml`,
    host: publicEnv.baseUrl,
  };
}
