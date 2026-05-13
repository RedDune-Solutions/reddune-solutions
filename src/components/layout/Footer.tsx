"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { contactInfo } from "@/config/contact";
import { cn } from "@/lib/utils";

/**
 * Footer — Phase 3 Oasis warm footer.
 *
 * Layout: 4-col grid on desktop (2fr 1fr 1fr 1fr), 1 col on mobile.
 *   col 1: brand + tagline + Instagram + endereço (Fuseta, Algarve)
 *   col 2: Serviços (3 links)
 *   col 3: Contacto (email + telefone + Instagram)
 *   col 4: Legal (privacidade + garantia)
 * + `.foot-bot` strip with copyright + microcopy in Geist Mono.
 *
 * Palette: bg ink, text cream/85, headings ember (Geist Mono uppercase).
 */
export function Footer() {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Navigation");
  const pathname = usePathname() ?? "/";

  // Preserve the existing `?from=` breadcrumb chain on legal / contact links.
  const origin = pathname.startsWith("/loja")
    ? "shop"
    : pathname.startsWith("/servicos")
      ? "pricing"
      : pathname.startsWith("/portfolio")
        ? "portfolio"
        : pathname.startsWith("/contacto")
          ? "contact"
          : "home";

  const contactHref =
    origin === "home" ? "/contacto" : `/contacto?from=${origin}`;
  const warrantyHref = `/loja/politica-garantia?from=${origin}`;
  const returnHref = `/loja/politica-devolucao?from=${origin}`;
  const privacyHref = `/politica-privacidade?from=${origin}`;
  const year = new Date().getFullYear();

  // Strip parentheses + spaces from the configured phone number for tel: links
  // e.g. "(+351) 961 531 235" → "+351961531235"
  const telHref = contactInfo.phone.replace(/[\s()]/g, "");

  // Derive the Instagram handle (e.g. "reddune_solutions") from the URL.
  const instagramHandle = (() => {
    try {
      const url = new URL(contactInfo.instagramUrl);
      const handle = url.pathname.replace(/^\/|\/$/g, "");
      return handle ? `@${handle}` : contactInfo.instagramUrl;
    } catch {
      return contactInfo.instagramUrl;
    }
  })();

  return (
    <footer className="bg-ink text-cream/85 relative z-[1]">
      <div className="mx-auto w-full max-w-content px-6 pt-16 pb-8 sm:px-8 lg:px-10">
        {/* foot-top — 4 cols on desktop, stacks on mobile */}
        <div
          className={cn(
            "grid gap-10 pb-12 border-b border-cream/10",
            // 2fr 1fr 1fr 1fr on desktop
            "md:grid-cols-[2fr_1fr_1fr_1fr]",
          )}
        >
          {/* Brand column */}
          <div className="max-w-sm">
            <Link
              href="/"
              aria-label="Reddune Solutions — Início"
              className="inline-flex items-center"
            >
              <Image
                src="/logo.png"
                alt="Reddune Solutions"
                width={140}
                height={36}
                className="h-9 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-cream/70">
              {t("tagline")}
            </p>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.16em] text-cream/55">
              {t("address")}
            </p>
          </div>

          {/* Serviços */}
          <nav aria-label={t("col1Title")}>
            <h5
              className={cn(
                "font-mono text-[11px] font-medium uppercase",
                "tracking-[0.18em] text-ember mb-4",
              )}
            >
              {t("col1Title")}
            </h5>
            <ul className="space-y-2 list-none">
              <li>
                <FooterLink href="/">{tNav("home")}</FooterLink>
              </li>
              <li>
                <FooterLink href="/servicos">{tNav("services")}</FooterLink>
              </li>
              <li>
                <FooterLink href="/portfolio">
                  {tNav.has("portfolio") ? tNav("portfolio") : "Portfólio"}
                </FooterLink>
              </li>
              <li>
                <FooterLink href="/loja">{tNav("shop")}</FooterLink>
              </li>
              <li>
                <FooterLink href={contactHref}>{t("contactButton")}</FooterLink>
              </li>
            </ul>
          </nav>

          {/* Contacto */}
          <nav aria-label={t("col2Title")}>
            <h5
              className={cn(
                "font-mono text-[11px] font-medium uppercase",
                "tracking-[0.18em] text-ember mb-4",
              )}
            >
              {t("col2Title")}
            </h5>
            <ul className="space-y-2 list-none">
              {contactInfo.email && (
                <li>
                  <FooterLink href={`mailto:${contactInfo.email}`} external>
                    {contactInfo.email}
                  </FooterLink>
                </li>
              )}
              {contactInfo.phone && (
                <li>
                  <FooterLink href={`tel:${telHref}`} external>
                    {contactInfo.phone}
                  </FooterLink>
                </li>
              )}
              <li>
                <FooterLink href={contactInfo.instagramUrl} external newTab>
                  {instagramHandle}
                </FooterLink>
              </li>
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label={t("col3Title")}>
            <h5
              className={cn(
                "font-mono text-[11px] font-medium uppercase",
                "tracking-[0.18em] text-ember mb-4",
              )}
            >
              {t("col3Title")}
            </h5>
            <ul className="space-y-2 list-none">
              <li>
                <FooterLink href={privacyHref}>{t("privacyPolicy")}</FooterLink>
              </li>
              <li>
                <FooterLink href={warrantyHref}>
                  {t("warrantyPolicy")}
                </FooterLink>
              </li>
              <li>
                <FooterLink href={returnHref}>
                  {t.has("returnPolicy") ? t("returnPolicy") : "Política de Devolução"}
                </FooterLink>
              </li>
            </ul>
          </nav>
        </div>

        {/* foot-bot — copyright + microcopy mono */}
        <div
          className={cn(
            "mt-8 flex flex-col gap-2 text-center",
            "font-mono text-[11px] uppercase tracking-[0.15em] text-cream/45",
            "sm:flex-row sm:justify-between sm:text-left",
          )}
        >
          <span>
            © {year} Reddune Solutions · {t("rights")}
          </span>
          <span>{t("copyMicrocopy")}</span>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Small typed link helper so we don't repeat hover/transition classes */
/* ------------------------------------------------------------------ */
type FooterLinkProps = {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  newTab?: boolean;
};

function FooterLink({ href, children, external, newTab }: FooterLinkProps) {
  const classes = cn(
    "inline-block text-sm text-cream/70 transition-colors duration-300",
    "hover:text-ember focus-visible:text-ember",
    "underline-offset-4 hover:underline focus-visible:underline",
    // Allow long emails to wrap without breaking layout
    "break-words",
  );

  if (external) {
    return (
      <a
        href={href}
        className={classes}
        {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
