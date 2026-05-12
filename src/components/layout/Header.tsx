"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "../templates/language-switcher";

/**
 * Header — Phase 3 Oasis pill nav.
 *
 * Floating cream pill, centered horizontally, fixed at top:18px.
 * Mobile (< 980px): hides nav list + desktop CTA, shows burger that
 *   opens a fullscreen drawer with the same paleta.
 *
 * Scroll behaviour is intentionally NOT implemented here — that lives
 * on /loja's filter bar (Phase 5).
 */

const MOBILE_BREAKPOINT_PX = 980;

export function Header() {
  const t = useTranslations("Navigation");
  const pathname = usePathname() ?? "/";
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  // Track viewport against the Oasis 980px breakpoint (not project's 768).
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
    const apply = () => setIsMobile(mql.matches);
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  // Close drawer on route change + esc + lock body scroll while open.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const navLinks = [
    { href: "/servicos", label: t("services") },
    { href: "/loja", label: t("shop") },
  ];

  const isActive = useCallback(
    (href: string) =>
      href === "/" ? pathname === "/" : pathname.startsWith(href),
    [pathname],
  );

  return (
    <>
      {/* Skip-link — required by a11y spec (must precede nav landmark) */}
      <a
        href="#main"
        className={cn(
          "sr-only focus:not-sr-only",
          "focus:fixed focus:top-3 focus:left-3 focus:z-[110]",
          "focus:rounded-btn focus:bg-ink focus:text-cream",
          "focus:px-4 focus:py-2 focus:text-sm focus:font-medium",
          "focus:shadow-warm",
        )}
      >
        Saltar para conteúdo
      </a>

      <header
        role="banner"
        className={cn(
          "fixed top-[18px] left-1/2 -translate-x-1/2 z-[100]",
          "flex items-center gap-6",
          "py-[10px] pl-[22px] pr-[12px]",
          "rounded-btn border border-dune-deep/10",
          "bg-cream/85 backdrop-blur-xl shadow-warm",
          // Mobile pill is tighter
          "max-[979px]:gap-3 max-[979px]:pl-4 max-[979px]:pr-2 max-[979px]:py-2",
        )}
      >
        <Link
          href="/"
          aria-label="Reddune Solutions — Início"
          className="inline-flex items-center shrink-0"
        >
          <Image
            src="/logo.png"
            alt="Reddune Solutions"
            width={140}
            height={40}
            priority
            className="h-10 w-auto object-contain"
          />
        </Link>

        {!isMobile && (
          <nav
            role="navigation"
            aria-label="Navegação principal"
            className="flex items-center"
          >
            <ul className="flex items-center gap-6 list-none">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative inline-block py-2 text-[14px] font-medium font-mono",
                        "text-ink transition-colors duration-300",
                        "hover:text-ember focus-visible:text-ember",
                        // Active underline (small ember pill)
                        "after:absolute after:left-1/2 after:-translate-x-1/2",
                        "after:bottom-[2px] after:h-[2px] after:rounded-full",
                        "after:bg-ember after:transition-[width] after:duration-300",
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
            </ul>
          </nav>
        )}

        {!isMobile && (
          <div className="flex items-center gap-2 shrink-0">
            <LanguageSwitcher />
            <Link
              href="/contacto?from=home"
              className={cn(
                "inline-flex items-center gap-2 rounded-btn",
                "bg-ink text-cream px-5 py-2.5",
                "text-[13px] font-semibold font-mono uppercase tracking-[0.04em]",
                "transition-all duration-300",
                "hover:bg-ember hover:scale-[1.04]",
                "focus-visible:bg-ember",
              )}
            >
              Contactar
              <span aria-hidden="true" className="text-base leading-none">
                →
              </span>
            </Link>
          </div>
        )}

        {isMobile && (
          <div className="flex items-center gap-1 shrink-0">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="oasis-mobile-drawer"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center",
                "rounded-full text-ink transition-colors",
                "hover:bg-dune-deep/5",
              )}
            >
              {open ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              )}
            </button>
          </div>
        )}
      </header>

      {/* Mobile drawer — fullscreen overlay (rendered only on mobile) */}
      {isMobile && (
        <div
          id="oasis-mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
          aria-hidden={!open}
          className={cn(
            "fixed inset-0 z-[99]",
            "bg-cream",
            "transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            open
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-3 pointer-events-none",
          )}
        >
          <div className="flex h-full w-full flex-col px-6 pt-28 pb-10">
            <nav
              role="navigation"
              aria-label="Navegação mobile"
              className="flex-1"
            >
              <ul className="flex flex-col gap-2 list-none">
                {[{ href: "/", label: t("home") }, ...navLinks].map((link) => {
                  const active = isActive(link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "block rounded-card px-5 py-4 font-display",
                          "text-3xl leading-none tracking-[-0.02em] font-semibold",
                          "transition-colors duration-200",
                          active
                            ? "text-ember"
                            : "text-ink hover:text-ember",
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <Link
              href="/contacto?from=home"
              onClick={() => setOpen(false)}
              className={cn(
                "mt-6 inline-flex items-center justify-center gap-3 rounded-btn",
                "bg-ink text-cream px-7 py-4",
                "text-base font-semibold font-mono uppercase tracking-[0.04em]",
                "transition-colors duration-300",
                "hover:bg-ember focus-visible:bg-ember",
              )}
            >
              Contactar
              <span aria-hidden="true" className="text-lg leading-none">
                →
              </span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
