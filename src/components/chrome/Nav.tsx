"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/templates/language-switcher";
import { SocialIcons } from "@/components/chrome/SocialIcons";

const DRAWER_MAX_PX = 900;

export type NavProps = {
  /** Slide the pill off-screen (e.g. scroll-down hide on /loja). */
  pillHidden?: boolean;
};

export function Nav({ pillHidden = false }: NavProps) {
  const t = useTranslations("Navigation");
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: "/servicos", label: t("services") },
    {
      href: "/portfolio",
      label: t.has("portfolio") ? t("portfolio") : "Portfólio",
    },
    { href: "/loja", label: t("shop") },
    { href: "/faq", label: t.has("faq") ? t("faq") : "FAQ" },
  ];

  const isActive = useCallback(
    (href: string) =>
      href === "/" ? pathname === "/" : pathname.startsWith(href),
    [pathname],
  );

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth > DRAWER_MAX_PX) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("nav-open", open);
    return () => document.body.classList.remove("nav-open");
  }, [open]);

  const contactLabel = t("contact");

  return (
    <>
      <nav
        role="navigation"
        aria-label="Navegação principal"
        className={cn(
          "top",
          "fixed top-[18px] left-1/2 z-[100]",
          "flex w-max max-w-[calc(100vw-24px)] max-[899px]:w-[calc(100vw-24px)] flex-nowrap items-center gap-6",
          "rounded-btn border border-dune-deep/10",
          "bg-cream/85 py-[10px] pl-[22px] pr-1.5 backdrop-blur-xl shadow-warm",
          "transition-transform duration-500 ease-oasis",
          pillHidden
            ? "-translate-x-1/2 -translate-y-[200%]"
            : "-translate-x-1/2 translate-y-0",
          "max-[899px]:gap-3 max-[899px]:pl-4 max-[899px]:pr-2 max-[899px]:py-2",
        )}
      >
        <Link
          href="/"
          className="logo inline-flex shrink-0 items-center"
          aria-label="Reddune Solutions — Início"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/logo-mark.png"
            alt="Reddune Solutions"
            width={40}
            height={40}
            priority
            className="h-10 w-10 object-contain"
          />
        </Link>

        <ul className="flex min-w-0 list-none items-center gap-6">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-block py-2 font-mono text-[14px] font-medium",
                    "text-ink transition-colors duration-300",
                    "hover:text-ember focus-visible:text-ember",
                    "after:absolute after:left-1/2 after:bottom-[2px] after:h-[2px] after:-translate-x-1/2",
                    "after:rounded-full after:bg-ember after:transition-[width] after:duration-300",
                    active
                      ? "text-ember after:w-[18px]"
                      : "after:w-0 hover:after:w-[18px]",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
          
         
          {/* Contacto link — aparece apenas no drawer mobile */}
          <li className="hidden max-[900px]:block">
            <Link
              href="/contacto?from=home"
              onClick={() => setOpen(false)}
              className={cn(
                "cta",
                "flex items-center gap-2 rounded-btn",
                "bg-ink px-5 py-2.5 font-mono text-[13px] font-medium uppercase tracking-[0.04em] text-cream",
                "transition-all duration-300",
                "hover:scale-[1.04] hover:bg-ember focus-visible:bg-ember",
                "mt-3 w-full justify-center",
              )}
            >
              {contactLabel}
              <ArrowRight
                className="size-[14px] shrink-0"
                strokeWidth={2.25}
                aria-hidden
              />
            </Link>
          </li>
        </ul>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <LanguageSwitcher />
          <Link
            href="/contacto?from=home"
            className={cn(
              "cta",
              "inline-flex max-[900px]:hidden items-center gap-2 rounded-btn",
              "bg-ink px-5 py-2.5 font-mono text-[13px] font-medium uppercase tracking-[0.04em] text-cream",
              "transition-all duration-300",
              "hover:scale-[1.04] hover:bg-ember focus-visible:bg-ember",
            )}
            onClick={() => setOpen(false)}
          >
            {contactLabel}
            <ArrowRight
              className="size-[14px] shrink-0"
              strokeWidth={2.25}
              aria-hidden
            />
          </Link>
          <button
            type="button"
            className="nav-toggle"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="bars" aria-hidden="true" />
          </button>
        </div>
      </nav>

      <div
        className="nav-drawer-backdrop"
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />
    </>
  );
}
