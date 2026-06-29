import "./globals.css";
import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Newsreader,
  DM_Sans,
  Geist_Mono,
} from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { RdLoaderFirstPaint } from "@/components/ui/rd-loader-first-paint";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { StructuredData } from "@/components/structured-data";
import { publicEnv } from "@/lib/env";

// === Oasis v5 fonts (Phase 1) ===
// Display headings (variable, axes opsz + wght)
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
  preload: true,
});

// Decorative italic only inside display headings (em tags)
const serif = Newsreader({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  weight: ["400", "500"],
  style: ["italic"],
  preload: false,
});

// Body copy (default font-family)
const body = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  preload: true,
});

// Eyebrows, meta, coordinates
const mono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500"],
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.baseUrl),
  appleWebApp: {
    capable: true,
    title: "RedDune",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    siteName: "Reddune Solutions",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#d6422a",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={cn(
        display.variable,
        serif.variable,
        body.variable,
        mono.variable,
        "!scroll-smooth"
      )}
    >
      <body className={cn("font-body antialiased")}>
        <ServiceWorkerRegister />
        <RdLoaderFirstPaint />
        <StructuredData />
        <NextIntlClientProvider messages={messages}>
          <ConfirmProvider>{children}</ConfirmProvider>
        </NextIntlClientProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
