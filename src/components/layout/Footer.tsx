"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { contactInfo } from "@/config/contact";
import { cn } from "@/lib/utils";
import { SocialIcons } from "@/components/chrome/SocialIcons";

/**
 * Footer — light Oasis footer (matches `site/index.html` + `.foot-top` /
 * `.foot-bot` in design-handoff `styles.css`): cream background, colour logo,
 * DM Sans body text (inherits Oasis `body` — matches `site/styles.css`),
 * Geist Mono uppercase ember column titles.
 */
export function Footer() {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Navigation");
  const pathname = usePathname() ?? "/";

  const origin = pathname.startsWith("/loja")
    ? "shop"
    : pathname.startsWith("/servicos")
      ? "pricing"
      : pathname.startsWith("/portfolio")
        ? "portfolio"
        : pathname.startsWith("/contacto")
          ? "contact"
          : "home";

  const warrantyHref = `/loja/politica-garantia?from=${origin}`;
  const returnHref = `/loja/politica-devolucao?from=${origin}`;
  const privacyHref = `/politica-privacidade?from=${origin}`;
  const year = new Date().getFullYear();

  const telHref = contactInfo.phone.replace(/[\s()]/g, "");

  return (
    <footer
      className={cn(
        "relative z-[1] bg-cream text-ink-soft",
        "border-t border-dune-deep/[0.14]",
      )}
    >
      <div className="mx-auto w-full max-w-content px-8 py-[60px] pb-8">
        <div
          className={cn(
            "foot-top grid gap-12 pb-12",
            "border-b border-dune-deep/[0.14]",
            "md:grid-cols-[2fr_1fr_1fr_1fr] md:gap-12",
          )}
        >
          {/* Brand */}
          <div className="max-w-[340px]">
            <Link
              href="/"
              aria-label="Reddune Solutions — Início"
              className="inline-flex items-center"
            >
              <Image
                src="/logo.png"
                alt="Reddune Solutions"
                width={160}
                height={44}
                className="h-9 w-auto object-contain"
              />
            </Link>
            <p
              className={cn(
                "mt-4 font-body text-[14px] font-normal leading-[1.55] text-ink-soft",
              )}
            >
              {t("tagline")}
            </p>
          </div>

          {/* Navegação */}
          <nav aria-label={t("col1Title")}>
            <h5
              className={cn(
                "mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.18em]",
                "text-ember",
              )}
            >
              {t("col1Title")}
            </h5>
            <ul className="list-none space-y-0">
              <FooterLi>
                <FooterLink href="/">{tNav("home")}</FooterLink>
              </FooterLi>
              <FooterLi>
                <FooterLink href="/servicos">{tNav("services")}</FooterLink>
              </FooterLi>
              <FooterLi>
                <FooterLink href="/portfolio">
                  {tNav.has("portfolio") ? tNav("portfolio") : "Portfólio"}
                </FooterLink>
              </FooterLi>
              <FooterLi>
                <FooterLink href="/loja">{tNav("shop")}</FooterLink>
              </FooterLi>
              <FooterLi>
                <FooterLink href="/faq">
                  {tNav.has("faq") ? tNav("faq") : "FAQ"}
                </FooterLink>
              </FooterLi>
            </ul>
          </nav>

          {/* Empresa */}
          <nav aria-label={t("col2Title")}>
            <h5
              className={cn(
                "mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.18em]",
                "text-ember",
              )}
            >
              {t("col2Title")}
            </h5>
            <ul className="list-none space-y-0">
              <FooterLi>
                <FooterLink href={warrantyHref}>{t("warrantyPolicy")}</FooterLink>
              </FooterLi>
              <FooterLi>
                <FooterLink href={returnHref}>
                  {t.has("returnPolicy") ? t("returnPolicy") : "Política de Devolução"}
                </FooterLink>
              </FooterLi>
              <FooterLi>
                <FooterLink href={privacyHref}>{t("privacyPolicy")}</FooterLink>
              </FooterLi>
            </ul>
          </nav>

          {/* Contacto */}
          <nav aria-label={t("col3Title")}>
            <h5
              className={cn(
                "mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.18em]",
                "text-ember",
              )}
            >
              {t("col3Title")}
            </h5>
            <ul className="list-none space-y-0">
              <FooterLi>
                <span
                  className={cn(
                    "font-body text-[14px] font-normal leading-[1.55] text-ink-soft",
                    "inline-flex min-h-[44px] items-center py-2",
                  )}
                >
                  {t("contactLocation")}
                </span>
              </FooterLi>
              {contactInfo.email ? (
                <FooterLi>
                  <FooterLink href={`mailto:${contactInfo.email}`} external>
                    {contactInfo.email}
                  </FooterLink>
                </FooterLi>
              ) : null}
              {contactInfo.phone ? (
                <FooterLi>
                  <FooterLink href={`tel:${telHref}`} external>
                    {contactInfo.phone}
                  </FooterLink>
                </FooterLi>
              ) : null}
              <FooterLi>
                <SocialIcons variant="ghost" className="mt-2 gap-2" />
              </FooterLi>
            </ul>
          </nav>
        </div>

        <div
          className={cn(
            "mt-6 flex justify-center",
            "font-mono text-[11px] font-medium uppercase tracking-[0.15em]",
            "text-ink-mute",
          )}
        >
          © {year} Reddune Solutions
        </div>
      </div>
    </footer>
  );
}

function FooterLi({ children }: { children: React.ReactNode }) {
  return <li>{children}</li>;
}

type FooterLinkProps = {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  newTab?: boolean;
};

function FooterLink({ href, children, external, newTab }: FooterLinkProps) {
  const classes = cn(
    "footer-link font-body text-[14px] font-normal leading-[1.55] text-ink-soft",
    "inline-flex min-h-[44px] max-w-full items-center py-2",
    "no-underline transition-colors duration-300",
    "hover:text-ember focus-visible:text-ember",
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
