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

// Hrefs that belong to the "Conteúdo · Sistema" section (everything else = Principal).
const SYSTEM_HREFS = new Set([
  "/painel/precos",
  "/painel/loja",
  "/painel/portfolio",
  "/painel/auditoria",
  "/painel/definicoes",
]);

type Props = {
  user: { name?: string | null; email?: string | null };
  /** Optional real counts keyed by href (e.g. tarefas pendentes, projetos, dívidas). */
  counts?: Record<string, number>;
};

export function Sidebar({ user, counts }: Props) {
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
  const isCollapsed = mounted && collapsed;

  const principal = nav.filter((n) => !SYSTEM_HREFS.has(n.href));
  const sistema = nav.filter((n) => SYSTEM_HREFS.has(n.href));

  const renderItem = ({ href, label, Icon, exact }: PainelNavItem) => {
    const active = isActive(href, exact);
    const pending = pendingHref === href && pathname !== href;
    const count = counts?.[href];
    return (
      <Link
        key={href}
        href={href}
        onClick={() => {
          if (href !== pathname) setPendingHref(href);
        }}
        aria-busy={pending ? "true" : undefined}
        title={isCollapsed ? label : undefined}
        className={cn("side-nav-item", (active || pending) && "active")}
      >
        <Icon className="ic" aria-hidden="true" />
        {!isCollapsed && <span>{label}</span>}
        {!isCollapsed && pending && <Loader2 className="ic animate-spin" style={{ marginLeft: "auto" }} aria-hidden="true" />}
        {!isCollapsed && !pending && count != null && count > 0 && (
          <span className="count">{count}</span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className="side hidden lg:flex"
      style={{ width: isCollapsed ? 72 : 248, flexShrink: 0 }}
    >
      <div className="side-head">
        {!isCollapsed && (
          <Link href="/" aria-label="Ver site público" className="side-logo">
            <Image src="/logo-mark.png" alt="" width={28} height={28} />
            <div className="wm">
              RedDune
              <small>Painel · 2026</small>
            </div>
          </Link>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
          className="side-collapse"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </button>
      </div>

      <div>
        {!isCollapsed && <div className="side-section-label">Principal</div>}
        <nav className="side-nav" aria-label="Navegação principal">
          {principal.map(renderItem)}
        </nav>
      </div>

      <div>
        {!isCollapsed && <div className="side-section-label">Conteúdo · Sistema</div>}
        <nav className="side-nav" aria-label="Conteúdo e sistema">
          {sistema.map(renderItem)}
        </nav>
      </div>

      <div className="side-spacer" />

      <Link
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="side-shortcut"
        title={isCollapsed ? "Ver site público" : undefined}
      >
        <ExternalLink className="ic" aria-hidden="true" />
        {!isCollapsed && <span>Ver site público</span>}
        {!isCollapsed && <ExternalLink className="arr" aria-hidden="true" />}
      </Link>

      <div className="side-user">
        <div className="av">{initial}</div>
        {!isCollapsed && (
          <div className="min-w-0">
            <div className="name truncate">{user.name ?? "Equipa"}</div>
            <div className="email truncate">{user.email}</div>
          </div>
        )}
        <SignOutButton iconOnly className="logout" />
      </div>
    </aside>
  );
}
