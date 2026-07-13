"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ExternalLink,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/auth/SignOutButton";
import {
  PAINEL_NAV_DEFAULT,
  PAINEL_CATEGORIAS,
  applyTabOrder,
  readTabOrder,
  TAB_ORDER_EVENT,
  type PainelNavItem,
} from "@/lib/painel-nav";

type Props = {
  user: { name?: string | null; email?: string | null };
  /** Optional real counts keyed by href (e.g. tarefas pendentes, projetos, dívidas). */
  counts?: Record<string, number>;
  /** Estado recolhido (72px) — controlado pelo PainelShell via .app.collapsed. */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

/**
 * Sidebar — `.side` do protótipo (Painel.html). Escura, com secções
 * "Principal" / "Conteúdo · Sistema", badges .count reais, atalho para o
 * site público e bloco do utilizador com logout. A ordem custom das tabs
 * (localStorage) e o spinner de navegação pendente mantêm-se.
 */
export function Sidebar({ user, counts, collapsed = false, onToggleCollapsed }: Props) {
  const pathname = usePathname() ?? "";
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [nav, setNav] = useState<PainelNavItem[]>(PAINEL_NAV_DEFAULT);

  useEffect(() => {
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

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const initial = (user.name ?? user.email ?? "?").slice(0, 1).toUpperCase();

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
        title={collapsed ? label : undefined}
        className={cn("side-nav-item", (active || pending) && "active")}
      >
        <Icon className="ic" aria-hidden="true" />
        {!collapsed && <span>{label}</span>}
        {!collapsed && pending && (
          <Loader2 className="ic animate-spin" style={{ marginLeft: "auto" }} aria-hidden="true" />
        )}
        {!collapsed && !pending && count != null && count > 0 && (
          <span className="count">{count}</span>
        )}
      </Link>
    );
  };

  return (
    <aside className="side">
      <div className="side-head">
        {!collapsed && (
          <Link href="/" title="Ver site público" className="side-logo">
            <Image src="/logo-mark.png" alt="" width={28} height={28} />
            <div className="wm">
              RedDune
              <small>Painel</small>
            </div>
          </Link>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          title={collapsed ? "Expandir" : "Recolher"}
          aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
          className="side-collapse"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </button>
      </div>

      {PAINEL_CATEGORIAS.map((cat) => {
        const itens = nav.filter((n) => n.category === cat.id);
        if (itens.length === 0) return null;
        return (
          <div key={cat.id}>
            {!collapsed && <div className="side-section-label">{cat.label}</div>}
            <nav className="side-nav" aria-label={cat.label}>
              {itens.map(renderItem)}
            </nav>
          </div>
        );
      })}

      <div className="side-spacer" />

      <Link
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="side-shortcut"
        title={collapsed ? "Ver site público" : undefined}
      >
        <ExternalLink className="ic" aria-hidden="true" />
        {!collapsed && <span>Ver site público</span>}
        {!collapsed && <ArrowUpRight className="ic arr" aria-hidden="true" />}
      </Link>

      <div className="side-user">
        <div className="av">{initial}</div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="name truncate">{user.name ?? "Equipa"}</div>
            <div className="email truncate">{user.email}</div>
          </div>
        )}
        {/* O botão vive dentro de um <form>; o marginLeft vai no wrapper
            porque é o form (não o botão) que é o flex-item de .side-user. */}
        <div style={{ marginLeft: "auto" }}>
          <SignOutButton iconOnly className="logout" />
        </div>
      </div>
    </aside>
  );
}
