import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RedDune Solutions",
    short_name: "RedDune",
    description: "Painel e site da RedDune Solutions — soluções informáticas no Algarve.",
    start_url: "/painel",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f7eedb",
    theme_color: "#d6422a",
    lang: "pt-PT",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
