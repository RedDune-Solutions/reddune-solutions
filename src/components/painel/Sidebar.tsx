"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ExternalLink,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/auth/SignOutButton";
import {
  PAINEL_NAV_DEFAULT,
  applyTabOrder,
  readTabOrder,
  TAB_ORDER_EVENT,
  type PainelNavItem,
} from "@/lib/painel-nav";

const COLLAPSE_KEY = "painel.sidebar.collapsed";

type Props = {
  user: { name?: string | null; email?: string | null };
};

export function Sidebar({ user }: Props) {
  const pathname = usePathname() ?? "";
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [nav, setNav] = useState<PainelNavItem[]>(PAINEL_NAV_DEFAULT);

  useEffect(() => {
    const saved = localStorage.getItem(COLLAPSE_KEY);
    if (saved === "1") setCollapsed(true);
    setMounted(true);
    const refresh = () => setNav(applyTabOrder(readTabOrder()));
    refresh();
    window.addEventListener(TAB_ORDER_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(TAB_ORDER_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const initial = (user.name ?? user.email ?? "?").slice(0, 1).toUpperCase();

  // Prevent hydration mismatch: render expanded initially, collapse only after mount
  const isCollapsed = mounted && collapsed;

  return (
    <aside
      className={cn(
        "hidden lg:flex h-screen sticky top-0 flex-col border-r border-dune-deep/10 bg-cream text-ink transition-[width] duration-200",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo + Collapse button */}
      <div
        className={cn(
          "flex items-center border-b border-dune-deep/10",
          isCollapsed ? "justify-center px-2 pt-5 pb-4" : "justify-between px-4 pt-5 pb-4"
        )}
      >
        {!isCollapsed && (
          <Link
            href="/"
            aria-label="Voltar ao site público"
            className="inline-flex items-center gap-2"
          >
            <Image
              src="/logo.png"
              alt="Reddune Solutions"
              width={120}
              height={38}
              className="h-8 w-auto object-contain"
            />
          </Link>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
          title={isCollapsed ? "Expandir" : "Recolher"}
          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-ink-mute hover:bg-cream-deep hover:text-ink transition-colors"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <nav
        className={cn("flex-1 min-h-0 overflow-y-auto py-5", isCollapsed ? "px-2" : "px-3")}
        aria-label="Navegação principal"
      >
        <ul className="space-y-1">
          {nav.map(({ href, label, Icon, exact }) => {
            const active = isActive(href, exact);
            const pending = pendingHref === href && pathname !== href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => {
                    if (href !== pathname) setPendingHref(href);
                  }}
                  aria-busy={pending ? "true" : undefined}
                  title={isCollapsed ? label : undefined}
                  className={cn(
                    "group flex items-center rounded-lg text-sm font-medium transition-all duration-200 border-l-2",
                    isCollapsed ? "justify-center px-0 py-2.5" : "justify-between gap-3 px-3 py-2.5",
                    active || pending
                      ? "bg-ember/10 text-ember border-ember"
                      : "border-transparent text-ink-soft hover:bg-cream-deep hover:text-ink"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center",
                      isCollapsed ? "" : "gap-2"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active || pending ? "text-ember" : "text-ink-mute group-hover:text-ink"
                      )}
                      aria-hidden="true"
                    />
                    {!isCollapsed && label}
                  </span>
                  {!isCollapsed && pending && (
                    <Loader2
                      className="h-4 w-4 animate-spin text-ember"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {!isCollapsed && (
          <div className="mt-6 pt-4 border-t border-dune-deep/10">
            <p className="px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-mute">
              Atalhos
            </p>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-xs text-ink-soft hover:bg-cream-deep hover:text-ink transition-colors"
            >
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
              Ver site público
            </Link>
          </div>
        )}

        {isCollapsed && (
          <div className="mt-6 pt-4 border-t border-dune-deep/10">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              title="Ver site público"
              className="flex items-center justify-center rounded-md py-2 text-ink-mute hover:bg-cream-deep hover:text-ink transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        )}
      </nav>

      <div
        className={cn(
          "shrink-0 border-t border-dune-deep/10 bg-sand-warm/40",
          isCollapsed ? "px-2 py-3" : "px-4 py-4"
        )}
      >
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              title={user.name ?? user.email ?? "Equipa"}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-ember/15 text-ember font-semibold text-sm"
            >
              {initial}
            </div>
            <SignOutButton
              iconOnly
              className="text-ink-soft hover:bg-ember hover:text-cream"
            />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ember/15 text-ember font-semibold text-sm">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate text-ink">
                  {user.name ?? "Equipa"}
                </p>
                <p className="text-xs text-ink-mute truncate">{user.email}</p>
              </div>
            </div>
            <div className="mt-3">
              <SignOutButton className="w-full justify-start text-ink-soft hover:bg-ember hover:text-cream" />
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
