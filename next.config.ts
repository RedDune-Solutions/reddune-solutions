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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      // Cobre os hosts de imagem usados (ver images.remotePatterns) + blob/data.
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      // Mapas Google embed.
      "frame-src https://www.google.com",
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
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
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
