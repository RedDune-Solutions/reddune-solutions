import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/painel", "/painel/", "/entrar", "/entrar/", "/p/"],
    },
    sitemap: `${publicEnv.baseUrl}/sitemap.xml`,
    host: publicEnv.baseUrl,
  };
}
