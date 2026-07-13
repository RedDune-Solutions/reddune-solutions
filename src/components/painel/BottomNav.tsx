"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  PAINEL_NAV_DEFAULT,
  applyTabOrder,
  readTabOrder,
  TAB_ORDER_EVENT,
  type PainelNavItem,
} from "@/lib/painel-nav";

/**
 * BottomNav — barra de navegação inferior horizontal, com scroll-x.
 * Só visível em mobile (lg:hidden). Substitui o drawer no telemóvel:
 * tabs em fila, deslizáveis, com a activa centrada.
 */
export function BottomNav({ counts }: { counts?: Record<string, number> }) {
  const pathname = usePathname() ?? "";
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

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    // Centra a tab activa na barra ao carregar/navegar.
    activeRef.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [pathname, nav]);

  return (
    <nav className="pnl-bottomnav" aria-label="Navegação do painel">
      <div className="pnl-bottomnav__scroll" ref={scrollRef}>
        {nav.map((item, i) => {
          const { href, label, Icon, exact } = item;
          const active = isActive(href, exact);
          const count = counts?.[href];
          // Separador quando muda de categoria (reflecte os grupos na barra).
          const newGroup = i > 0 && nav[i - 1]!.category !== item.category;
          return (
            <div key={href} className="contents">
              {newGroup && <span className="pnl-bottomnav__sep" aria-hidden="true" />}
              <Link
                href={href}
                ref={active ? activeRef : undefined}
                className={cn("pnl-bottomnav__item", active && "active")}
                aria-current={active ? "page" : undefined}
              >
                {count != null && count > 0 && <span className="count">{count}</span>}
                <Icon className="ic" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
