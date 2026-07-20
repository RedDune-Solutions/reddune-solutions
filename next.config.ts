import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
  allowedDevOrigins: ["192.168.0.100"],
  experimental: {
    scrollRestoration: true,
  },

  async redirects() {
    return [
      {
        source: "/pricingPage",
        destination: "/servicos",
        permanent: true,
      },
      // Rename 2026-07-20: tarefas → lembretes. permanent:false — rota interna
      // do painel, sem valor SEO; evita 308 cacheado se um dia voltar a mudar.
      {
        source: "/painel/tarefas",
        destination: "/painel/lembretes",
        permanent: false,
      },
      // Slug inválido de serviço → hub. Em produção o loading.tsx faz
      // streaming e o 200 sai antes do notFound() (soft-404); este redirect
      // resolve no edge, antes do render. permanent:false — se um dia houver
      // slug novo, os browsers/Google não ficam com 308 cacheado.
      {
        source:
          "/servicos/:slug((?!assistencia-tecnica$|web-digital$|software-recuperacao$).*)",
        destination: "/servicos",
        permanent: false,
      },
    ];
  },

  async headers() {
    // CSP em REPORT-ONLY de propósito: o browser apenas reporta violações na
    // consola, nunca bloqueia recursos. Isto permite observar o que partiria
    // ANTES de fazer enforce, sem risco de partir o site. Para passar a enforce
    // (header "Content-Security-Policy") é preciso testar no browser primeiro —
    // confirmar que nada aparece como violação (scripts inline do Next, mapas
    // embed, imagens dos hosts em images.remotePatterns, etc.).
    const cspReportOnly = [
      "default-src 'self'",
      // Next precisa de inline/eval (sobretudo em dev). Em report-only é seguro.
      // challenges.cloudflare.com: Turnstile (adormecido) exige-o em script-src E
      // frame-src; incluir já evita 403 no form quando ativarem chaves + enforce.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      // Cobre os hosts de imagem usados (ver images.remotePatterns) + blob/data.
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      // Mapas Google embed + widget Turnstile (ver nota em script-src) +
      // 'self'/blob: (iframes do portal: srcdoc de mockups, proxy de PDF) +
      // https: (links de preview externos que o admin adiciona ao projecto).
      "frame-src 'self' blob: https: https://www.google.com https://challenges.cloudflare.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Report-only: observação, nunca bloqueio. Ver comentário acima.
          { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
        ],
      },
    ];
  },

  images: {
    // AVIF primeiro (fallback WebP automático na negociação do optimizador).
    formats: ["image/avif", "image/webp"],
    // 31 dias: evita a Vercel re-buscar cada variante a cada request
    // (Cache-Control max-age=0 por defeito). Seguro porque os assets públicos
    // raramente mudam e os do Blob têm filenames únicos; se um ficheiro em
    // public/ for substituído, renomear (cache busting).
    minimumCacheTTL: 2678400,
    remotePatterns: [
      { protocol: "https", hostname: "flagcdn.com", pathname: "/**" },
      { protocol: "https", hostname: "instagram.flis11-1.fna.fbcdn.net", pathname: "/**" },
      { protocol: "https", hostname: "drive.google.com", pathname: "/**" },
      { protocol: 'https', hostname: 'instagram.flis11-2.fna.fbcdn.net', port: '', pathname: '/**', },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com", pathname: "/**" },
    ],
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
