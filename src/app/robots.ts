import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // /api fica FORA do disallow de propósito: o fetcher do Resumo Matinal
      // (tarefa agendada) respeita robots.txt e parsers simples não aplicam a
      // precedência "Allow mais específico ganha" — o antigo Disallow /api/
      // bloqueava-o mesmo com Allow /api/brief. robots.txt não é segurança
      // (todas as rotas /api têm auth própria); a não-indexação é garantida
      // pelo X-Robots-Tag: noindex no next.config.ts, o mecanismo certo.
      allow: "/",
      disallow: ["/painel", "/painel/", "/entrar", "/entrar/", "/p/"],
    },
    sitemap: `${publicEnv.baseUrl}/sitemap.xml`,
    host: publicEnv.baseUrl,
  };
}
